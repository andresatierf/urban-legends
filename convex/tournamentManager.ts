import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { extractDateFromISO, nowUTC } from "./lib/dates";
import { enrichWithRelations } from "./lib/helpers";
import { hasMinimumRole, validateMinimumRole } from "./roles";
import { getCurrentUserOrThrow } from "./users";

/**
 * Get the count of pending submissions for tournaments assigned to this manager.
 *
 * Note: The tournament assignment system (spec 11) is not yet implemented.
 * For now, tournament managers see ALL pending submissions.
 * Once the assignment system is built, this will be filtered to only assigned tournaments.
 */
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!hasMinimumRole(user, "tournament_manager")) {
      return 0;
    }

    // TODO: Filter by assigned tournaments once spec 11 is implemented
    // For now, show all pending submissions

    // Count pending individual submissions
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count pending submission groups
    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});

/**
 * Get dashboard statistics for tournament managers.
 * Provides overview of tournaments, teams, and submissions.
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    validateMinimumRole(user, "tournament_manager");

    // Get all tournaments (tournament managers can access all)
    const tournaments = await ctx.db.query("tournaments").collect();

    const now = extractDateFromISO(nowUTC());

    // Categorize tournaments
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    // Enrich tournaments with teams in parallel
    const enrichedTournaments = await enrichWithRelations(ctx, tournaments, {
      teams: { table: "teams", foreignKeyField: "tournamentId" },
    });

    // Get all teams and enrich with submissions
    const allTeams = enrichedTournaments.flatMap((t) => t.teams);
    const enrichedTeams = await enrichWithRelations(ctx, allTeams, {
      submissions: { table: "submissions", foreignKeyField: "teamId" },
    });

    const teamSubmissionsMap = new Map(
      enrichedTeams.map((t) => [t._id, t.submissions]),
    );

    // Count teams and submissions across all tournaments
    let totalTeams = 0;
    let totalSubmissions = 0;
    let pendingSubmissions = 0;

    for (const enrichedTournament of enrichedTournaments) {
      totalTeams += enrichedTournament.teams.length;

      for (const team of enrichedTournament.teams) {
        const submissions = teamSubmissionsMap.get(team._id) || [];

        totalSubmissions += submissions.length;
        pendingSubmissions += submissions.filter(
          (s) => s.state === "pending",
        ).length;
      }
    }

    return {
      tournaments: {
        total: tournaments.length,
        active: activeTournaments.length,
        upcoming: upcomingTournaments.length,
        ended: endedTournaments.length,
      },
      teams: {
        total: totalTeams,
      },
      submissions: {
        total: totalSubmissions,
        pending: pendingSubmissions,
      },
    };
  },
});

/**
 * Get recent activity across all tournaments.
 * Returns timeline of events like team creation, submissions, approvals.
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit || 30;

    validateMinimumRole(user, "tournament_manager");

    // Get all tournaments
    const tournaments = await ctx.db.query("tournaments").collect();

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      tournamentName?: string;
    }> = [];

    // Get recent teams and submissions for each tournament
    for (const tournament of tournaments) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .order("desc")
        .take(10);

      for (const team of teams) {
        const creator = await ctx.db.get(team.createdBy);
        activities.push({
          type: "team_created",
          description: `${creator?.name || "User"} created team "${team.name}"`,
          timestamp: team._creationTime,
          tournamentName: tournament.name,
        });
      }

      // Get recent submissions
      for (const team of teams) {
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .order("desc")
          .take(5);

        for (const sub of submissions) {
          if (sub.state === "approved" || sub.state === "rejected") {
            const submitter = await ctx.db.get(sub.userId);
            activities.push({
              type: `submission_${sub.state}`,
              description: `Submission by ${submitter?.name || "User"} for ${team.name} was ${sub.state}`,
              timestamp: sub._creationTime,
              tournamentName: tournament.name,
            });
          }
        }
      }
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});

export const getSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    validateMinimumRole(user, "tournament_manager");

    const submissions = await ctx.db.query("submissions").collect();
    if (submissions.length === 0) return [];

    const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
    const teamIds = Array.from(new Set(submissions.map((s) => s.teamId)));

    const [users, teams] = await Promise.all([
      ctx.db
        .query("users")
        .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
        .collect(),
      ctx.db
        .query("teams")
        .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))))
        .collect(),
    ]);

    const userIdMap = users.reduce<Map<Id<"users">, Doc<"users">>>(
      (acc, user) => {
        acc.set(user._id, user);
        return acc;
      },
      new Map(),
    );

    const teamIdMap = teams.reduce<Map<Id<"teams">, Doc<"teams">>>(
      (acc, team) => {
        acc.set(team._id, team);
        return acc;
      },
      new Map(),
    );

    const submissionsWithUserAndTeam = submissions.map((s) => ({
      ...s,
      user: userIdMap.get(s.userId) as Doc<"users">,
      team: teamIdMap.get(s.teamId) as Doc<"teams">,
    }));

    return submissionsWithUserAndTeam.toSorted((a, b) => {
      if (a.date === b.date) return 0;
      return a.date.localeCompare(b.date);
    });
  },
});
