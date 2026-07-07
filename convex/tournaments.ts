import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  canCreateTournament,
  canEditTournament,
  canInviteToTeam,
  computeTournamentPermissions,
  isGlobalAdminOrDev,
  onTournamentCreated,
} from "./authority/core";
import { nowUTC, toUTCDateString, toUTCEndOfDayString } from "./lib/dates";
import { batchGetDocuments, enrichWithRelations } from "./lib/helpers";
import { notifyTournamentWinner } from "./notifications/triggers";
import { getTeams } from "./teams";
import { getCurrentUserOrThrow } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentIds: v.optional(v.array(v.id("tournaments"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (args.tournamentIds)
      return await ctx.db
        .query("tournaments")
        .filter((q) =>
          q.or(
            ...(args.tournamentIds as typeof args.tournamentIds).map(
              (tournamentId) => q.eq(q.field("_id"), tournamentId),
            ),
          ),
        )
        .collect();

    let tournaments: Doc<"tournaments">[];
    if (args.userId) {
      const teams = await getTeams(ctx, { userId: args.userId });
      const tournamentIds = teams.map((team) => team.tournamentId);
      tournaments = await ctx.db
        .query("tournaments")
        .filter((q) =>
          q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))),
        )
        .collect();
    } else {
      tournaments = await ctx.db.query("tournaments").collect();
    }

    const nowIso = nowUTC();

    return tournaments.toSorted((a, b) => {
      const isActive = (x: typeof a) =>
        x.startDate <= nowIso && x.endDate >= nowIso;
      const isFuture = (x: typeof a) => x.startDate > nowIso;
      const isEnded = (x: typeof a) => x.endDate < nowIso;

      if (
        (isActive(a) && isActive(b)) ||
        (isFuture(a) && isFuture(b)) ||
        (isEnded(a) && isEnded(b))
      )
        return b.startDate.localeCompare(a.startDate);

      if (isActive(a)) return -1;
      if (isActive(b)) return 1;
      if (isFuture(a)) return -1;
      if (isFuture(b)) return 1;

      return 0;
    });
  },
});

export const get = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.tournamentId && !args.tournamentName)
      throw new Error("Must provide either id or name");

    if (args.tournamentId && args.tournamentName)
      throw new Error("Must provide only id or name");

    if (args.tournamentName)
      return await ctx.db
        .query("tournaments")
        .withIndex("by_name", (q) =>
          q.eq("name", args.tournamentName as typeof args.tournamentName),
        )
        .unique();

    return await ctx.db.get(
      args.tournamentId as NonNullable<typeof args.tournamentId>,
    );
  },
});

export const getDetails = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const enrichedTeams = await enrichWithRelations(ctx, teams, {
      teamMembers: {
        table: "teamMembers",
        foreignKeyField: "teamId",
        enrich: {
          user: { table: "users", foreignKey: (m) => m.userId },
        },
      },
    });

    const teamsWithMembers = enrichedTeams.map((enrichedTeam) => {
      const { teamMembers, ...team } = enrichedTeam;
      const memberDetails = teamMembers
        .map((member) =>
          member.user ? { ...member.user, memberRole: member.role } : null,
        )
        .filter((u): u is NonNullable<typeof u> => u !== null);

      return {
        ...team,
        memberCount: teamMembers.length,
        members: memberDetails,
      };
    });

    const userTeamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const userTeamIds = userTeamMemberships.map((m) => m.teamId);
    const userTeam = teamsWithMembers.find((team) =>
      userTeamIds.includes(team._id),
    );

    const nowIso = nowUTC();
    let status: "active" | "upcoming" | "ended";
    if (tournament.startDate <= nowIso && tournament.endDate >= nowIso) {
      status = "active";
    } else if (tournament.startDate > nowIso) {
      status = "upcoming";
    } else {
      status = "ended";
    }

    const tournamentPerms = await computeTournamentPermissions(
      ctx,
      user._id,
      args.tournamentId,
    );
    const canEdit = tournamentPerms.canEdit;
    const canDelete = tournamentPerms.canDelete;
    const canViewLeaderboard = true;

    const totalTeams = teams.length;
    const totalParticipants = teamsWithMembers.reduce(
      (sum, team) => sum + team.memberCount,
      0,
    );
    const averageTeamSize = totalTeams > 0 ? totalParticipants / totalTeams : 0;

    return {
      tournament,
      teams: teamsWithMembers,
      userTeam: userTeam
        ? {
            ...userTeam,
            memberCount: userTeam.memberCount,
          }
        : null,
      status,
      canEdit,
      canDelete,
      canViewLeaderboard,
      statistics: {
        totalTeams,
        totalParticipants,
        averageTeamSize,
      },
    };
  },
});

export const upsert = mutation({
  args: {
    _id: v.optional(v.id("tournaments")),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    teamMinSize: v.number(),
    teamMaxSize: v.number(),
    maxActivitiesPerDay: v.optional(v.number()),

    scoringConfig: v.optional(
      v.object({
        individualPoints: v.object({
          base: v.number(),
          advanced: v.number(),
        }),
        teamExercisePoints: v.object({
          base: v.number(),
          advanced: v.number(),
        }),
        teamExerciseThreshold: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (args._id) {
      await canEditTournament.require(ctx, user._id, {
        tournamentId: args._id,
      });
    } else {
      await canCreateTournament.require(ctx, user._id);
    }

    const defaultScoringConfig = {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    const data = {
      name: args.name,
      description: args.description || "",
      startDate: toUTCDateString(args.startDate),
      endDate: toUTCEndOfDayString(args.endDate),
      teamMinSize: args.teamMinSize,
      teamMaxSize: args.teamMaxSize,
      maxActivitiesPerDay: args.maxActivitiesPerDay,
      scoringConfig: args.scoringConfig || defaultScoringConfig,
    };

    if (args._id) {
      const tournament = await ctx.db.get(args._id);

      if (!tournament) throw new Error("Tournament not found");

      await ctx.db.patch(args._id, data);

      return args._id;
    }

    const tournamentId = await ctx.db.insert("tournaments", {
      ...data,
      createdBy: user._id,
    });
    await onTournamentCreated(ctx, { tournamentId, creatorId: user._id });
    return tournamentId;
  },
});

export const getAvailableUsersForTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canInviteToTeam.require(ctx, user._id, { teamId: args.teamId });

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", team.tournamentId),
      )
      .collect();

    const teamMembers = await Promise.all(
      teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      ),
    );

    const userIdsInTeams = Array.from(
      new Set(teamMembers.flat().map((m) => m.userId)),
    );

    if (userIdsInTeams.length === 0) {
      return await ctx.db.query("users").collect();
    }

    const availableUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(...userIdsInTeams.map((id) => q.neq(q.field("_id"), id))),
      )
      .collect();

    return availableUsers;
  },
});

type ValidateUserInTournamentTeamArgs = {
  userId: Id<"users">;
  tournamentId: Id<"tournaments">;
};

export async function validateUserNotInTournamentTeam(
  ctx: QueryCtx,
  args: ValidateUserInTournamentTeamArgs,
) {
  const userTeams = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .collect();

  if (userTeams.length === 0) {
    return;
  }

  const teamIds = userTeams.map((m) => m.teamId);

  const existingTeamInTournament = await ctx.db
    .query("teams")
    .filter((q) =>
      q.and(
        q.eq(q.field("tournamentId"), args.tournamentId),
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
      ),
    )
    .first();

  if (existingTeamInTournament) {
    throw new Error("You already have a team in this tournament");
  }
}

export const getLeaderboard = query({
  args: {
    tournamentId: v.id("tournaments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const enrichedTeams = await enrichWithRelations(ctx, teams, {
      teamMembers: { table: "teamMembers", foreignKeyField: "teamId" },
    });

    const teamsWithCounts = enrichedTeams.map((enrichedTeam) => {
      const { teamMembers, ...team } = enrichedTeam;
      const points = team.points ?? 0;
      return {
        teamId: team._id,
        teamName: team.name,
        points,
        memberCount: teamMembers.length,
        lastActivityAt: team.lastActivityAt,
        createdAt: team._creationTime,
      };
    });

    const sortedTeams = teamsWithCounts.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      if (a.lastActivityAt && b.lastActivityAt) {
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      }
      if (a.lastActivityAt) return -1;
      if (b.lastActivityAt) return 1;

      return a.createdAt - b.createdAt;
    });

    const limitedTeams = args.limit
      ? sortedTeams.slice(0, args.limit)
      : sortedTeams;

    const leaderboard = limitedTeams.map((team, index) => ({
      rank: index + 1,
      ...team,
      isWinner: tournament.winnerId === team.teamId,
    }));

    return leaderboard;
  },
});

export const getWinner = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament?.winnerId) return null;

    const team = await ctx.db.get(tournament.winnerId);
    if (!team) return null;

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) =>
        q.eq("teamId", tournament.winnerId as typeof tournament.winnerId),
      )
      .collect();

    const userIds = members.map((m) => m.userId);
    const users = await batchGetDocuments(ctx, "users", userIds);

    return {
      team,
      members: users,
      completedAt: tournament.completedAt,
    };
  },
});

/**
 * ADMIN UTILITY - Manual Execution Only
 *
 * Determines and records the winner of a tournament based on the leaderboard.
 * This function automatically selects the team with the highest points as the winner.
 *
 * **Usage:**
 * 1. Ensure the tournament has ended (enforced by validation)
 * 2. Run this mutation via the Convex dashboard or future admin UI
 * 3. The winning team will be recorded in the tournament record
 *
 * **Logic:**
 * - Validates that the tournament has ended
 * - Sorts teams by points (descending) with lastActivityAt as tie-breaker
 * - Sets the top team as the winner
 * - Records completion timestamp
 *
 * **Safety:**
 * - Admin-only access
 * - Cannot be run before tournament end date
 * - Requires at least one team to exist
 *
 * @param tournamentId - The ID of the tournament to determine winner for
 *
 * @internal This function is intended for manual execution by admins.
 *          May be integrated into admin dashboard UI in the future.
 */
export const determineWinner = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canEditTournament.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const now = new Date();
    const endDate = new Date(tournament.endDate);
    if (now < endDate) {
      throw new Error("Cannot determine winner before tournament ends");
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    if (teams.length === 0) {
      throw new Error("No teams in this tournament");
    }

    const sortedTeams = teams.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      if (a.lastActivityAt && b.lastActivityAt) {
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      }
      if (a.lastActivityAt) return -1;
      if (b.lastActivityAt) return 1;

      return a._creationTime - b._creationTime;
    });

    const winner = sortedTeams[0];

    await ctx.db.patch(args.tournamentId, {
      winnerId: winner._id,
      completedAt: nowUTC(),
    });

    // T029: Notify all tournament participants about winner
    const allTeamMembers = await Promise.all(
      teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      ),
    );

    const allParticipantIds = Array.from(
      new Set(allTeamMembers.flat().map((m) => m.userId)),
    );

    if (allParticipantIds.length > 0) {
      await notifyTournamentWinner(ctx, {
        recipientIds: allParticipantIds,
        tournamentId: args.tournamentId,
        tournamentName: tournament.name,
        winnerTeamName: winner.name,
      });
    }

    return {
      winnerId: winner._id,
      winnerName: winner.name,
      points: winner.points,
    };
  },
});

export const getStatistics = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) return null;

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const allActivities = await ctx.db
      .query("activities")
      .withIndex("by_tournament_and_date", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const approvedActivities = allActivities.filter(
      (a) => a.state === "approved",
    );

    const averageTeamScore =
      teams.length > 0
        ? teams.reduce((sum, team) => sum + team.points, 0) / teams.length
        : 0;

    const mostActiveTeam =
      teams.length > 0 ? teams.sort((a, b) => b.points - a.points)[0] : null;

    const activitiesByDate = new Map<string, number>();
    for (const activity of approvedActivities) {
      const day = activity.date.slice(0, 10);
      activitiesByDate.set(day, (activitiesByDate.get(day) || 0) + 1);
    }

    let highestScoringDay: { date: string; activities: number } | null = null;
    for (const entry of Array.from(activitiesByDate.entries())) {
      const [date, count] = entry;
      if (!highestScoringDay || count > highestScoringDay.activities) {
        highestScoringDay = { date, activities: count };
      }
    }

    const teamsWithActivities = new Set(
      approvedActivities.map((a) => a.teamId),
    );
    const participationRate =
      teams.length > 0 ? teamsWithActivities.size / teams.length : 0;

    return {
      totalTeams: teams.length,
      totalActivities: approvedActivities.length,
      averageTeamScore,
      mostActiveTeam: mostActiveTeam
        ? {
            teamId: mostActiveTeam._id,
            name: mostActiveTeam.name,
            points: mostActiveTeam.points,
          }
        : null,
      highestScoringDay,
      participationRate,
    };
  },
});

// ── listWithAuthority ────────────────────────────────────────────────────────

type AuthorityInfo = {
  canManage: boolean;
  canReview: boolean;
  pendingReviewCount: number;
  team?: {
    _id: Id<"teams">;
    name: string;
    points: number;
    isCaptain: boolean;
    approvedActivities: number;
    totalActivities: number;
  };
};

export type TournamentWithAuthority = Doc<"tournaments"> & {
  teamCount: number;
  authority: AuthorityInfo;
};

function sortTournamentsByStatus<
  T extends { startDate: string; endDate: string },
>(list: T[], nowIso: string): T[] {
  const statusRank = (t: T): number => {
    if (t.startDate <= nowIso && t.endDate >= nowIso) return 0; // active
    if (t.startDate > nowIso) return 1; // upcoming
    return 2; // ended
  };
  return [...list].sort((a, b) => {
    const ra = statusRank(a);
    const rb = statusRank(b);
    if (ra !== rb) return ra - rb;
    // Ended tournaments: most recently ended first
    if (ra === 2) return b.endDate.localeCompare(a.endDate);
    // Active + upcoming: soonest start first
    return a.startDate.localeCompare(b.startDate);
  });
}

export const listWithAuthority = query({
  args: {
    includeEnded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const includeEnded = args.includeEnded ?? false;

    const isAdminDev = await isGlobalAdminOrDev(ctx, user._id);

    // Batch-load all tournament roles for this user
    const userTournamentRoles = await ctx.db
      .query("tournamentRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Map: tournamentId → roles[]
    const tournamentRoleMap = new Map<
      Id<"tournaments">,
      Array<"tournament_manager" | "reviewer">
    >();
    for (const tr of userTournamentRoles) {
      const existing = tournamentRoleMap.get(tr.tournamentId) ?? [];
      tournamentRoleMap.set(tr.tournamentId, [...existing, tr.role]);
    }

    // Batch-load user's team memberships, then resolve the team docs
    const userTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const userTeams = (
      await Promise.all(
        userTeamMembers.map(async (tm) => {
          const team = await ctx.db.get(tm.teamId);
          return team ? { team, membership: tm } : null;
        }),
      )
    ).filter(
      (t): t is { team: Doc<"teams">; membership: Doc<"teamMembers"> } =>
        t !== null,
    );

    // Map: tournamentId → { team, membership } (one team per tournament per user)
    const teamByTournamentId = new Map<
      Id<"tournaments">,
      { team: Doc<"teams">; membership: Doc<"teamMembers"> }
    >();
    for (const { team, membership } of userTeams) {
      teamByTournamentId.set(team.tournamentId, { team, membership });
    }

    const nowIso = nowUTC();
    let allTournaments = await ctx.db.query("tournaments").collect();
    if (!includeEnded) {
      allTournaments = allTournaments.filter((t) => t.endDate >= nowIso);
    }

    // Batch-load team counts to avoid N+1 queries
    const allTeams = await ctx.db.query("teams").collect();
    const teamCountMap = new Map<Id<"tournaments">, number>();
    for (const team of allTeams) {
      teamCountMap.set(
        team.tournamentId,
        (teamCountMap.get(team.tournamentId) ?? 0) + 1,
      );
    }

    const yours: TournamentWithAuthority[] = [];
    const discover: TournamentWithAuthority[] = [];

    for (const tournament of allTournaments) {
      const tournamentRoles = tournamentRoleMap.get(tournament._id) ?? [];
      const userTeamData = teamByTournamentId.get(tournament._id);

      // Authority derived from system roles, tournament roles, and team membership
      const canManage =
        isAdminDev || tournamentRoles.includes("tournament_manager");
      const canReview =
        isAdminDev ||
        tournamentRoles.includes("reviewer") ||
        tournamentRoles.includes("tournament_manager");

      let pendingReviewCount = 0;
      if (canReview) {
        const pendingRows = await ctx.db
          .query("activities")
          .withIndex("by_tournament_and_state", (q) =>
            q.eq("tournamentId", tournament._id).eq("state", "pending"),
          )
          .collect();
        pendingReviewCount = pendingRows.length;
      }

      let team: AuthorityInfo["team"];
      if (userTeamData) {
        const { team: teamDoc, membership } = userTeamData;
        const teamActivities = await ctx.db
          .query("activities")
          .withIndex("by_team", (q) => q.eq("teamId", teamDoc._id))
          .collect();
        const activeActivities = teamActivities.filter(
          (a) => a.state !== "deleted",
        );
        const approvedCount = activeActivities.filter(
          (a) => a.state === "approved",
        ).length;
        team = {
          _id: teamDoc._id,
          name: teamDoc.name,
          points: teamDoc.points,
          isCaptain: membership.role === "captain",
          approvedActivities: approvedCount,
          totalActivities: activeActivities.length,
        };
      }

      const authority: AuthorityInfo = {
        canManage,
        canReview,
        pendingReviewCount,
        team,
      };

      // Partition rule: direct relationship = tournamentRoles row OR teamMembership.
      // System role override does NOT place a tournament in Yours.
      const hasDirectRelationship =
        tournamentRoles.length > 0 || !!userTeamData;

      const teamCount = teamCountMap.get(tournament._id) ?? 0;
      const item: TournamentWithAuthority = {
        ...tournament,
        teamCount,
        authority,
      };

      if (hasDirectRelationship) {
        yours.push(item);
      } else {
        discover.push(item);
      }
    }

    return {
      yours: sortTournamentsByStatus(yours, nowIso),
      discover: sortTournamentsByStatus(discover, nowIso),
    };
  },
});

// ── listManaged ──────────────────────────────────────────────────────────────
// Tournaments the current user directly manages via a `tournament_manager`
// tournamentRole. Feeds the sidebar's operator entry points — global admin/dev
// authority is intentionally excluded so admins/devs don't see every tournament
// pinned to their sidebar.

export const listManaged = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const managerRoles = await ctx.db
      .query("tournamentRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "tournament_manager"))
      .collect();

    const tournaments = (
      await Promise.all(managerRoles.map((r) => ctx.db.get(r.tournamentId)))
    ).filter((t): t is Doc<"tournaments"> => t !== null);

    return sortTournamentsByStatus(tournaments, nowUTC());
  },
});
