import { v } from "convex/values";

import { query } from "./_generated/server";
import { enrichWithRelations } from "./lib/helpers";

/**
 * Get public leaderboards for all active tournaments.
 * No authentication required - publicly accessible.
 */
export const getPublicLeaderboards = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").collect();

    const now = new Date().toISOString();
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );

    const enrichedTournaments = await enrichWithRelations(
      ctx,
      activeTournaments,
      {
        teams: {
          table: "teams",
          foreignKeyField: "tournamentId",
          enrich: {
            teamMembers: { table: "teamMembers", foreignKeyField: "teamId" },
          },
        },
      },
    );

    const leaderboards = await Promise.all(
      enrichedTournaments.map(async (enrichedTournament) => {
        const { teams, ...tournament } = enrichedTournament;

        const sortedTeams = teams.sort((a, b) => b.points - a.points);

        const top10Teams = sortedTeams.slice(0, 10).map((team, index) => {
          const memberCount = team.teamMembers.length;

          return {
            rank: index + 1,
            team: {
              _id: team._id,
              name: team.name,
              points: team.points,
            },
            memberCount,
          };
        });

        return {
          tournament: {
            _id: tournament._id,
            name: tournament.name,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
          },
          leaderboard: top10Teams,
          totalTeams: teams.length,
        };
      }),
    );

    return leaderboards;
  },
});

/**
 * Get live tournament feed showing recent activity.
 * No authentication required - publicly accessible.
 */
export const getLiveTournamentFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const tournaments = await ctx.db.query("tournaments").collect();

    const now = new Date().toISOString();
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );

    if (activeTournaments.length === 0) {
      return [];
    }

    const activeTournamentIds = new Set(activeTournaments.map((t) => t._id));

    const allSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "approved"))
      .order("desc")
      .take(limit * 2);

    const filteredSubmissions = allSubmissions
      .filter((s) => activeTournamentIds.has(s.tournamentId))
      .slice(0, limit);

    const enrichedSubmissions = await Promise.all(
      filteredSubmissions.map(async (submission) => {
        const [user, team, tournament] = await Promise.all([
          ctx.db.get(submission.userId),
          ctx.db.get(submission.teamId),
          ctx.db.get(submission.tournamentId),
        ]);

        return {
          id: submission._id,
          user: user ? { name: user.name } : null,
          team: team ? { name: team.name, points: team.points } : null,
          tournament: tournament ? { name: tournament.name } : null,
          tier: submission.tier,
          pointsEarned: submission.pointsEarned,
          submissionType: submission.submissionType,
          timestamp: new Date(submission._creationTime).toISOString(),
        };
      }),
    );

    return enrichedSubmissions;
  },
});
