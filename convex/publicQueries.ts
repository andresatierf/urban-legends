import { v } from "convex/values";
import { query } from "./_generated/server";
import { enrichWithRelations } from "./lib/helpers";
import { enrichTeamsWithMembers } from "./teams";

/**
 * Get public leaderboards for all active tournaments.
 * No authentication required - publicly accessible.
 */
export const getPublicLeaderboards = query({
  args: {},
  handler: async (ctx) => {
    // Get all tournaments
    const tournaments = await ctx.db.query("tournaments").collect();

    // Filter to active tournaments (ongoing tournaments)
    const now = new Date().toISOString();
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );

    // Enrich active tournaments with their teams in parallel
    const enrichedTournaments = await enrichWithRelations(
      ctx,
      activeTournaments,
      {
        teams: { table: "teams", foreignKeyField: "tournamentId" },
      },
    );

    // Get all teams and enrich with member counts
    const allTeams = enrichedTournaments.flatMap((t) => t.teams);
    const teamIds = allTeams.map((team) => team._id);

    const teamsWithMembersData = await enrichTeamsWithMembers(ctx, teamIds);
    const teamMemberCountMap = new Map(
      teamsWithMembersData.map((data) => [data.team._id, data.memberCount]),
    );

    // Get leaderboard data for each active tournament
    const leaderboards = await Promise.all(
      enrichedTournaments.map(async (enrichedTournament) => {
        // Extract base tournament properties
        const { teams, ...tournament } = enrichedTournament;

        // Sort teams by points (descending)
        const sortedTeams = teams.sort((a, b) => b.points - a.points);

        // Get top 10 teams with member count
        const top10Teams = sortedTeams.slice(0, 10).map((team, index) => {
          const memberCount = teamMemberCountMap.get(team._id) || 0;

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

    // Get all tournaments
    const tournaments = await ctx.db.query("tournaments").collect();

    // Filter to active tournaments
    const now = new Date().toISOString();
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );

    if (activeTournaments.length === 0) {
      return [];
    }

    const activeTournamentIds = new Set(activeTournaments.map((t) => t._id));

    // Get recent approved submissions from active tournaments
    const allSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "approved"))
      .order("desc")
      .take(limit * 2); // Take more to filter

    // Filter to submissions from active tournaments and enrich
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
