import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { getTeams, validateIsTeamMember } from "./teams";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

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

    const nowIso = new Date().toISOString();

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

/**
 * Get comprehensive tournament details with all related entities and permissions.
 * This query follows the pattern established by submissions.getDetails to provide
 * a single, efficient query for detail pages.
 */
export const getDetails = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Fetch tournament
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Fetch all teams for this tournament
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    // Fetch member counts and member details for each team in parallel
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        // Fetch user details for each member
        const memberUsers = await Promise.all(
          members.map((member) => ctx.db.get(member.userId)),
        );

        return {
          ...team,
          memberCount: members.length,
          members: memberUsers.filter((u) => u !== null),
        };
      }),
    );

    // Find user's team in this tournament
    const userTeamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const userTeamIds = userTeamMemberships.map((m) => m.teamId);
    const userTeam = teamsWithMembers.find((team) =>
      userTeamIds.includes(team._id),
    );

    // Calculate tournament status
    const nowIso = new Date().toISOString();
    let status: "active" | "upcoming" | "ended";
    if (tournament.startDate <= nowIso && tournament.endDate >= nowIso) {
      status = "active";
    } else if (tournament.startDate > nowIso) {
      status = "upcoming";
    } else {
      status = "ended";
    }

    // Determine permissions
    const isAdmin = user.roleNames.includes("admin");
    const canEdit = isAdmin;
    const canDelete = isAdmin;
    const canViewLeaderboard = true; // Anyone can view leaderboard

    // Calculate statistics
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
    maxSubmissionsPerDay: v.optional(v.number()),
    // Scoring configuration (optional for backwards compatibility)
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

    validateIsAdmin(user);

    // Default scoring config if not provided
    const defaultScoringConfig = {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    const data = {
      name: args.name,
      description: args.description || "",
      startDate: args.startDate,
      endDate: args.endDate,
      teamMinSize: args.teamMinSize,
      teamMaxSize: args.teamMaxSize,
      maxSubmissionsPerDay: args.maxSubmissionsPerDay,
      scoringConfig: args.scoringConfig || defaultScoringConfig,
    };

    if (args._id) {
      const tournament = await ctx.db.get(args._id);

      if (!tournament) throw new Error("Tournament not found");

      await ctx.db.patch(args._id, data);

      return args._id;
    }

    return await ctx.db.insert("tournaments", { ...data, createdBy: user._id });
  },
});

// Get users not in any team for a given tournament
export const getAvailableUsersForTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      captain: true,
    });

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Get all teams in this tournament
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", team.tournamentId),
      )
      .collect();

    // Get all team members in this tournament
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
  // Check if user already has a team in this tournament
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

// Get leaderboard for a tournament with rankings
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

    // Get all teams for tournament
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    // Get member counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        const points = team.points ?? 0;
        return {
          teamId: team._id,
          teamName: team.name,
          points,
          memberCount: members.length,
          lastActivityAt: team.lastActivityAt,
          createdAt: team._creationTime,
        };
      }),
    );

    // Sort by points DESC, lastActivityAt DESC (more recent wins), createdAt ASC (earlier creation wins)
    const sortedTeams = teamsWithCounts.sort((a, b) => {
      // First sort by points (descending)
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      // If points are equal, sort by lastActivityAt (descending - more recent wins)
      if (a.lastActivityAt && b.lastActivityAt) {
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      }
      if (a.lastActivityAt) return -1;
      if (b.lastActivityAt) return 1;

      // If still tied, sort by creation time (ascending - earlier wins)
      return a.createdAt - b.createdAt;
    });

    // Apply limit if provided
    const limitedTeams = args.limit
      ? sortedTeams.slice(0, args.limit)
      : sortedTeams;

    // Add rank and isWinner flag
    const leaderboard = limitedTeams.map((team, index) => ({
      rank: index + 1,
      ...team,
      isWinner: tournament.winnerId === team.teamId,
    }));

    return leaderboard;
  },
});

// Get winner of a tournament
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

    const users = await Promise.all(
      members.map((member) => ctx.db.get(member.userId)),
    );

    return {
      team,
      members: users.filter((u) => u !== null),
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

    validateIsAdmin(user);

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Validate tournament has ended
    const now = new Date();
    const endDate = new Date(tournament.endDate);
    if (now < endDate) {
      throw new Error("Cannot determine winner before tournament ends");
    }

    // Get all teams sorted by points
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    if (teams.length === 0) {
      throw new Error("No teams in this tournament");
    }

    // Sort teams using same logic as leaderboard
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

    // Update tournament with winner
    await ctx.db.patch(args.tournamentId, {
      winnerId: winner._id,
      completedAt: new Date().toISOString(),
    });

    return {
      winnerId: winner._id,
      winnerName: winner.name,
      points: winner.points,
    };
  },
});

// Get tournament statistics
export const getStatistics = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) return null;

    // Get all teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    // Get all submissions for this tournament
    const allSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_tournament_and_date", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const approvedSubmissions = allSubmissions.filter(
      (s) => s.state === "approved",
    );

    // Calculate average team score
    const averageTeamScore =
      teams.length > 0
        ? teams.reduce((sum, team) => sum + team.points, 0) / teams.length
        : 0;

    // Find most active team (highest points)
    const mostActiveTeam =
      teams.length > 0 ? teams.sort((a, b) => b.points - a.points)[0] : null;

    // Find highest scoring day
    const submissionsByDate = new Map<string, number>();
    for (const submission of approvedSubmissions) {
      submissionsByDate.set(
        submission.date,
        (submissionsByDate.get(submission.date) || 0) + 1,
      );
    }

    let highestScoringDay: { date: string; submissions: number } | null = null;
    for (const entry of Array.from(submissionsByDate.entries())) {
      const [date, count] = entry;
      if (!highestScoringDay || count > highestScoringDay.submissions) {
        highestScoringDay = { date, submissions: count };
      }
    }

    // Calculate participation rate (teams with at least one submission)
    const teamsWithSubmissions = new Set(
      approvedSubmissions.map((s) => s.teamId),
    );
    const participationRate =
      teams.length > 0 ? teamsWithSubmissions.size / teams.length : 0;

    return {
      totalTeams: teams.length,
      totalSubmissions: approvedSubmissions.length,
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
