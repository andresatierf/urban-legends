import { v } from "convex/values";
import { query } from "../_generated/server";
import { extractDateFromISO, nowUTC } from "../lib/dates";
import { enrichWithRelations } from "../lib/helpers";
import { hasMinimumRole, validateMinimumRole } from "../roles";
import { getCurrentUserOrThrow } from "../users";

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

    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

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

    const tournaments = await ctx.db.query("tournaments").collect();

    const now = extractDateFromISO(nowUTC());

    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    const enrichedTournaments = await enrichWithRelations(ctx, tournaments, {
      teams: { table: "teams", foreignKeyField: "tournamentId" },
    });

    const allTeams = enrichedTournaments.flatMap((t) => t.teams);
    const enrichedTeams = await enrichWithRelations(ctx, allTeams, {
      submissions: { table: "submissions", foreignKeyField: "teamId" },
    });

    const teamSubmissionsMap = new Map(
      enrichedTeams.map((t) => [t._id, t.submissions]),
    );

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

    const tournaments = await ctx.db.query("tournaments").collect();

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      tournamentName?: string;
    }> = [];

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

    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});
