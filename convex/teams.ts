import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import {
  canDeleteTeam,
  canEditTeam,
  canManageTeamMembers,
  computeTeamPermissions,
} from "./authority/core";
import { enrichWithRelations } from "./lib/helpers";
import {
  recompute as lifecycleRecompute,
  recomputeRecentActivity,
} from "./lifecycle/submissions";
import { notifyRemovedFromTeam } from "./notifications/triggers";
import { validateUserNotInTournamentTeam } from "./tournaments";
import { getCurrentUserOrThrow, getUser } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.userId && !args.tournamentId)
      return await ctx.db.query("teams").collect();

    let query = ctx.db.query("teams");

    if (args.userId) {
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) =>
          q.eq("userId", args.userId as typeof args.userId),
        )
        .collect();

      const teamIds = memberships.map((m) => m.teamId);

      query = query.filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
      );
    }

    if (args.tournamentId) {
      query = query.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
    }

    return await query.collect();
  },
});

export const listMembers = query({
  args: { teamIds: v.union(v.id("teams"), v.array(v.id("teams"))) },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!Array.isArray(args.teamIds)) {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) =>
          q.eq("teamId", args.teamIds as unknown as Id<"teams">),
        )
        .collect();
    }

    const teamMembersPerTeam = await Promise.all(
      args.teamIds.map((id) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", id))
          .collect(),
      ),
    );

    return teamMembersPerTeam.flat();
  },
});

export const listWithMembers = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    let teams: Doc<"teams">[];

    if (!args.userId && !args.tournamentId) {
      teams = await ctx.db.query("teams").collect();
    } else {
      let q = ctx.db.query("teams");

      if (args.userId) {
        const memberships = await ctx.db
          .query("teamMembers")
          .withIndex("by_user", (q) =>
            q.eq("userId", args.userId as typeof args.userId),
          )
          .collect();
        const teamIds = memberships.map((m) => m.teamId);
        q = q.filter((q) =>
          q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
        );
      }

      if (args.tournamentId) {
        q = q.filter((q) => q.eq(q.field("tournamentId"), args.tournamentId));
      }

      teams = await q.collect();
    }

    if (teams.length === 0) return [];

    const enriched = await enrichWithRelations(ctx, teams, {
      teamMembers: {
        table: "teamMembers",
        foreignKeyField: "teamId",
        enrich: {
          user: { table: "users", foreignKey: (m) => m.userId },
        },
      },
    });

    const tournamentIds = Array.from(
      new Set(enriched.map((t) => t.tournamentId)),
    );
    const rankings = new Map<string, { rank: number; totalTeams: number }>();
    await Promise.all(
      tournamentIds.map(async (tournamentId) => {
        const rankedTeams = await ctx.db
          .query("teams")
          .withIndex("by_tournament_and_points", (q) =>
            q.eq("tournamentId", tournamentId),
          )
          .order("desc")
          .collect();
        rankedTeams.forEach((t, idx) => {
          rankings.set(t._id, {
            rank: idx + 1,
            totalTeams: rankedTeams.length,
          });
        });
      }),
    );

    return enriched.map((enrichedTeam) => {
      const { teamMembers, ...team } = enrichedTeam;
      const members = teamMembers
        .map((m) => (m.user ? { ...m.user, memberRole: m.role } : null))
        .filter((m): m is NonNullable<typeof m> => m !== null);
      const ranking = rankings.get(team._id);
      return {
        ...team,
        members,
        rank: ranking?.rank,
        totalTeams: ranking?.totalTeams,
      };
    });
  },
});

export const get = query({
  args: {
    userId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.teamId && !args.teamName && !args.userId && !args.tournamentId)
      throw new Error(
        "Must provide either team id, team name and tournament id, or user and tournament ids",
      );

    if (
      (args.teamId && (args.teamName || args.userId || args.tournamentId)) ||
      (args.teamName && (args.userId || !args.tournamentId)) ||
      (args.userId && !args.tournamentId) ||
      (args.tournamentId && !args.teamName && !args.userId)
    )
      throw new Error(
        "Must provide either team id, team name and tournament id, or user and tournament ids",
      );

    if (args.teamId) return await ctx.db.get(args.teamId);

    if (args.teamName && args.tournamentId)
      return await ctx.db
        .query("teams")
        .withIndex("by_tournament_and_name", (q) =>
          q
            .eq("tournamentId", args.tournamentId as typeof args.tournamentId)
            .eq("name", args.teamName as typeof args.teamName),
        )
        .unique();

    if (args.userId && args.tournamentId) {
      const userTeams = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) =>
          q.eq("userId", args.userId as typeof args.userId),
        )
        .collect();
      const teamIds = userTeams.map((m) => m.teamId);
      return await ctx.db
        .query("teams")
        .filter((q) =>
          q.and(
            q.eq(q.field("tournamentId"), args.tournamentId),
            q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
          ),
        )
        .unique();
    }

    throw new Error("This should never happen");
  },
});

/**
 * Get comprehensive team details with all related entities and permissions.
 * This query follows the pattern established by submissions.getDetails to provide
 * a single, efficient query for detail pages.
 */
export const getDetails = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const [tournament, teamMembers, submissions] = await Promise.all([
      ctx.db.get(team.tournamentId),
      ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect(),
      ctx.db
        .query("submissions")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect(),
    ]);

    const membersWithRoles = await Promise.all(
      teamMembers.map(async (member) => {
        const memberUser = await getUser(ctx, {
          userId: member.userId,
          throw: false,
        });
        if (!memberUser) return null;
        return {
          ...memberUser,
          memberRole: member.role,
        };
      }),
    );

    const members = membersWithRoles.filter((m) => m !== null);

    const captain = members.find((m) => m.memberRole === "captain") || null;

    const userMembership = teamMembers.find((m) => m.userId === user._id);

    const approvedSubmissions = submissions.filter(
      (s) => s.state === "approved",
    );
    const totalSubmissions = submissions.length;
    const approvalRate =
      totalSubmissions > 0 ? approvedSubmissions.length / totalSubmissions : 0;

    const permissions = await computeTeamPermissions(
      ctx,
      user._id,
      args.teamId,
    );

    return {
      team,
      tournament,
      members,
      captain,
      userMembership: userMembership
        ? {
            role: userMembership.role,
            userId: userMembership.userId,
          }
        : null,
      statistics: {
        points: team.points ?? 0,
        memberCount: members.length,
        submissionCount: totalSubmissions,
        approvalRate,
      },
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
      canInvite: permissions.canInvite,
      canLeave: permissions.canLeave,
      canTransferCaptaincy: permissions.canTransferCaptaincy,
      canManageMembers: permissions.canManageMembers,
    };
  },
});

export const removeUserTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canDeleteTeam.require(ctx, user._id, { teamId: args.teamId });

    const submissions = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();

    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    await Promise.all(
      [
        submissions.map(({ _id }) => ctx.db.delete(_id)),
        joinRequests.map(({ _id }) => ctx.db.delete(_id)),
        teamMembers.map(({ _id }) => ctx.db.delete(_id)),
      ].flat(),
    );

    return await ctx.db.delete(args.teamId);
  },
});

export const getUserTeamByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const userTeam = await ctx.db
      .query("teamMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.or(...teams.map(({ _id }) => q.eq(q.field("teamId"), _id))),
        ),
      )
      .first();

    return teams.find(({ _id }) => userTeam?.teamId === _id);
  },
});

export const listTeamMembers = query({
  args: { teamId: v.id("teams"), excludeSelf: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          ...teamMembers.map((member) => q.eq(q.field("_id"), member.userId)),
        ),
      )
      .collect();

    return users
      .filter((u) => !args.excludeSelf || u._id !== user._id)
      .map((u) => ({
        ...u,
        role: teamMembers.find((m) => m.userId === u._id)?.role,
      }));
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canManageTeamMembers.require(ctx, user._id, { teamId: args.teamId });
    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: args.userId,
    });

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId),
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);

      // T024: Notify removed user
      const team = await ctx.db.get(args.teamId);
      if (team) {
        await notifyRemovedFromTeam(ctx, {
          userId: args.userId,
          teamId: args.teamId,
          teamName: team.name,
        });
      }
    }
  },
});

type GetTeamsArgs = { userId?: Id<"users">; tournamentId?: Id<"tournaments"> };

export async function getTeams(
  ctx: QueryCtx,
  { userId, tournamentId }: GetTeamsArgs,
) {
  if (!userId && !tournamentId) return await ctx.db.query("teams").collect();

  const filter: { teamIds: Id<"teams">[]; tournamentId?: Id<"tournaments"> } = {
    teamIds: [],
  };

  if (userId) {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    filter.teamIds.push(...memberships.map((m) => m.teamId));
  }

  if (tournamentId) {
    filter.tournamentId = tournamentId;
  }

  const teams = await ctx.db
    .query("teams")
    .filter((q) =>
      q.and(
        q.or(...filter.teamIds.map((id) => q.eq(q.field("_id"), id as string))),
      ),
    )
    .collect();

  return teams;
}

export const upsertUserTeam = mutation({
  args: {
    _id: v.optional(v.id("teams")),
    name: v.string(),
    tournamentId: v.id("tournaments"),
    joinPolicy: v.union(v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (args._id) {
      await canEditTeam.require(ctx, user._id, { teamId: args._id });
    }

    const data = {
      name: args.name,
      tournamentId: args.tournamentId,
      joinPolicy: args.joinPolicy,
    };

    if (args._id) {
      const team = await ctx.db.get(args._id);
      if (!team) {
        throw new Error("Team not found");
      }

      if (args.name !== team.name) {
        await validateUniqueTeamName(ctx, {
          tournamentId: team.tournamentId,
          name: args.name,
        });
      }

      await ctx.db.patch(args._id, data);

      return args._id;
    }

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    await validateUserNotInTournamentTeam(ctx, {
      userId: user._id,
      tournamentId: args.tournamentId,
    });

    await validateUniqueTeamName(ctx, {
      tournamentId: args.tournamentId,
      name: args.name,
    });

    const teamId = await ctx.db.insert("teams", {
      ...data,
      createdBy: user._id,
      maxMembers: tournament.teamMaxSize,
      points: 0,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user._id,
      role: "captain",
    });

    return teamId;
  },
});

export const leaveTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    const allMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (membership.role === "captain" && allMembers.length > 1) {
      throw new Error(
        "As captain, you must transfer captaincy before leaving the team",
      );
    }

    await ctx.db.delete(membership._id);

    if (allMembers.length === 1) {
      await ctx.db.delete(args.teamId);
    }
  },
});

export const transferCaptaincy = mutation({
  args: {
    teamId: v.id("teams"),
    newCaptainId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const currentCaptainMembership = await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      captain: true,
    });

    const newCaptainMembership = await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: args.newCaptainId,
    });

    const team = await ctx.db.get(args.teamId);
    const oldCaptain = await ctx.db.get(user._id);
    const newCaptain = await ctx.db.get(args.newCaptainId);

    await ctx.db.patch(currentCaptainMembership._id, { role: "member" });
    await ctx.db.patch(newCaptainMembership._id, { role: "captain" });

    // Notify new captain
    if (team && newCaptain) {
      await ctx.scheduler.runAfter(0, internal.notifications.create, {
        userId: args.newCaptainId,
        type: "captain_role_transferred_to",
        title: `You are now captain of ${team.name}`,
        body: `${oldCaptain?.name || "The previous captain"} transferred captain role to you.`,
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
        actionUrl: `/teams/${args.teamId}`,
      });
    }

    // Notify old captain
    if (team && oldCaptain) {
      await ctx.scheduler.runAfter(0, internal.notifications.create, {
        userId: user._id,
        type: "captain_role_transferred_from",
        title: `You transferred captain role in ${team.name}`,
        body: `${newCaptain?.name || "A team member"} is now the captain.`,
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
        actionUrl: `/teams/${args.teamId}`,
      });
    }
  },
});

type ValidateIsTeamMemberArgs = {
  userId: Id<"users">;
  teamId: Id<"teams">;
  captain?: boolean;
  invert?: boolean;
};

export async function validateIsTeamMember(
  ctx: QueryCtx,
  args: ValidateIsTeamMemberArgs & { invert: true },
): Promise<null>;
export async function validateIsTeamMember(
  ctx: QueryCtx,
  args: ValidateIsTeamMemberArgs & { invert?: false },
): Promise<Doc<"teamMembers">>;
export async function validateIsTeamMember(
  ctx: QueryCtx,
  args: ValidateIsTeamMemberArgs,
): Promise<Doc<"teamMembers"> | null> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", args.teamId).eq("userId", args.userId),
    )
    .first();

  if (args.invert && args.captain) {
    throw new Error("Can't invert and check for captain at the same time");
  }

  if (!args.invert && !membership) {
    throw new Error("Team membership required");
  }

  if (args.invert && membership) {
    throw new Error("User already part of team");
  }

  if (args.captain && membership?.role !== "captain") {
    throw new Error("Captain access required");
  }

  return membership;
}

type ValidateUniqueTeamNameArgs = {
  tournamentId: Id<"tournaments">;
  name: string;
};

async function validateUniqueTeamName(
  ctx: QueryCtx,
  args: ValidateUniqueTeamNameArgs,
) {
  const existingTeamName = await ctx.db
    .query("teams")
    .withIndex("by_tournament_and_name", (q) =>
      q.eq("tournamentId", args.tournamentId).eq("name", args.name),
    )
    .first();

  if (existingTeamName) {
    throw new Error("Team name already exists in this tournament");
  }
}

type ValidateTeamHasSpaceArgs = {
  teamId: Id<"teams">;
};

export async function validateTeamHasSpace(
  ctx: QueryCtx,
  args: ValidateTeamHasSpaceArgs,
) {
  const team = await ctx.db.get(args.teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const currentMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  if (team.maxMembers && currentMembers.length >= team.maxMembers) {
    throw new Error("Team is full");
  }

  return team;
}

export const recalculatePoints = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canManageTeamMembers.require(ctx, user._id, { teamId: args.teamId });

    const result = await lifecycleRecompute(
      ctx,
      { kind: "team", id: args.teamId },
      user._id,
    );

    const updatedTeam = await ctx.db.get(args.teamId);

    return {
      teamId: args.teamId,
      points: updatedTeam?.points ?? 0,
      lastActivityAt: updatedTeam?.lastActivityAt,
      submissionsUpdated: result.submissionsTouched,
    };
  },
});

export const getStatistics = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) return null;

    const allSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const approvedSubmissions = allSubmissions.filter(
      (s) => s.state === "approved",
    );
    const pendingSubmissions = allSubmissions.filter(
      (s) => s.state === "pending",
    );
    const rejectedSubmissions = allSubmissions.filter(
      (s) => s.state === "rejected",
    );

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const today = new Date();
    const currentDate = today > endDate ? endDate : today;

    // Inclusive day count: matches `getUserStatistics` in convex/submissions.ts,
    // where both startDate and endDate count as full days.
    const tournamentDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const daysSoFar =
      today < startDate
        ? 0
        : Math.floor(
            (currentDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;

    const approvalRate =
      allSubmissions.length > 0
        ? approvedSubmissions.length / allSubmissions.length
        : 0;

    const averagePointsPerDay = daysSoFar > 0 ? team.points / daysSoFar : 0;

    const approvedDates = new Set(
      approvedSubmissions
        .map((s) => s.date)
        .sort()
        .reverse(),
    );
    let currentStreak = 0;
    const streakDate = new Date(today);
    streakDate.setHours(0, 0, 0, 0);

    const maxIterations = 1000;

    while (currentStreak < maxIterations) {
      const dateStr = streakDate.toISOString().split("T")[0];
      if (approvedDates.has(dateStr)) {
        currentStreak++;
        streakDate.setDate(streakDate.getDate() - 1);
      } else {
        break;
      }
    }

    const memberContributions = new Map<Id<"users">, number>();
    for (const submission of approvedSubmissions) {
      memberContributions.set(
        submission.userId,
        (memberContributions.get(submission.userId) || 0) + 1,
      );
    }

    const memberContributionsArray = Array.from(
      memberContributions.entries(),
    ).map(([userId, count]) => ({ userId, count }));

    const uniqueSubmissionDays = new Set(approvedSubmissions.map((s) => s.date))
      .size;
    const completionRate = daysSoFar > 0 ? uniqueSubmissionDays / daysSoFar : 0;

    const rankedTeams = await ctx.db
      .query("teams")
      .withIndex("by_tournament_and_points", (q) =>
        q.eq("tournamentId", team.tournamentId),
      )
      .order("desc")
      .collect();
    const totalTeams = rankedTeams.length;
    const rank = rankedTeams.findIndex((t) => t._id === args.teamId) + 1;

    return {
      totalSubmissions: allSubmissions.length,
      approvedSubmissions: approvedSubmissions.length,
      pendingSubmissions: pendingSubmissions.length,
      rejectedSubmissions: rejectedSubmissions.length,
      approvalRate,
      averagePointsPerDay,
      currentStreak,
      memberContributions: memberContributionsArray,
      completionRate,
      tournamentDays,
      daysSoFar,
      rank,
      totalTeams,
    };
  },
});

// One-shot backfill for team.recentActivity. Safe to re-run.
// Invoke via Convex dashboard or `bunx convex run teams:backfillRecentActivity`.
export const backfillRecentActivity = internalMutation({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    for (const team of teams) {
      await recomputeRecentActivity(ctx, team._id);
    }
    return { teamsBackfilled: teams.length };
  },
});
