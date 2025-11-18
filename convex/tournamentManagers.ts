import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

/**
 * Get dashboard statistics for tournament managers.
 * Provides overview of tournaments, teams, and submissions.
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (
      !user.roleNames.includes("tournament_manager") &&
      !user.roleNames.includes("admin")
    ) {
      throw new Error("Tournament Manager or Admin access required");
    }

    // Get all tournaments (tournament managers can access all)
    const tournaments = await ctx.db.query("tournaments").collect();

    const now = new Date().toISOString().split("T")[0];

    // Categorize tournaments
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    // Count teams and submissions across all tournaments
    let totalTeams = 0;
    let totalSubmissions = 0;
    let pendingSubmissions = 0;

    for (const tournament of tournaments) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      totalTeams += teams.length;

      for (const team of teams) {
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

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

    if (
      !user.roleNames.includes("tournament_manager") &&
      !user.roleNames.includes("admin")
    ) {
      throw new Error("Tournament Manager or Admin access required");
    }

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
