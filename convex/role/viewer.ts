import { query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../users";

/**
 * Get viewer dashboard data including active tournaments to follow.
 * Requires authentication (viewer role or higher).
 */
export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);

    const allTournaments = await ctx.db.query("tournaments").collect();
    const now = new Date().toISOString();
    const activeTournaments = allTournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );

    const tournaments = await Promise.all(
      activeTournaments.slice(0, 10).map(async (tournament) => {
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_tournament", (q) =>
            q.eq("tournamentId", tournament._id),
          )
          .collect();

        const topTeam = teams.sort((a, b) => b.points - a.points)[0];

        return {
          tournament,
          teamCount: teams.length,
          topTeam: topTeam || null,
        };
      }),
    );

    return {
      tournaments,
    };
  },
});
