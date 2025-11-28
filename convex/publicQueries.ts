import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

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

    const activeTournamentIds = activeTournaments.map((t) => t._id);

    const teams = await ctx.db
      .query("teams")
      .filter((q) =>
        q.or(
          ...activeTournamentIds.map((id) => q.eq(q.field("tournamentId"), id)),
        ),
      )
      .collect();

    const tournamentTeamsMap = teams.reduce<
      Map<Id<"tournaments">, Doc<"teams">[]>
    >((map, team) => {
      if (!map.has(team.tournamentId)) {
        map.set(team.tournamentId, []);
      }
      map.get(team.tournamentId)?.push(team);
      return map;
    }, new Map());

    const teamIds = teams.map((team) => team._id);

    const members = await ctx.db
      .query("teamMembers")
      .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("teamId"), id))))
      .collect();

    const teamMembersMap = members.reduce<
      Map<Id<"teams">, Doc<"teamMembers">[]>
    >((map, member) => {
      if (!map.has(member.teamId)) {
        map.set(member.teamId, []);
      }
      map.get(member.teamId)?.push(member);
      return map;
    }, new Map());

    // Get leaderboard data for each active tournament
    const leaderboards = await Promise.all(
      activeTournaments.map(async (tournament) => {
        // Get all teams in this tournament
        const teams = tournamentTeamsMap.get(tournament._id) || [];

        // Sort teams by points (descending)
        const sortedTeams = teams.sort((a, b) => b.points - a.points);

        // Get top 10 teams with member count
        const top10Teams = await Promise.all(
          sortedTeams.slice(0, 10).map(async (team, index) => {
            const memberCount = teamMembersMap.get(team._id) || [];

            return {
              rank: index + 1,
              team: {
                _id: team._id,
                name: team.name,
                points: team.points,
              },
              memberCount: memberCount.length,
            };
          }),
        );

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
