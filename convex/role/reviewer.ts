import { query } from "../_generated/server";
import { IllegalAccess, hasSomeReviewAccess } from "../authority/core";
import { getCurrentUserOrThrow } from "../users";

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeReviewAccess(ctx, user._id))) {
      return 0;
    }

    const pendingActivities = await ctx.db
      .query("activities")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingActivities.length;
  },
});

export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeReviewAccess(ctx, user._id)))
      throw new IllegalAccess("reviewer");

    const reviewed = await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("managedBy"), user._id))
      .collect();

    const totalReviews = reviewed.length;
    const approved = reviewed.filter((a) => a.state === "approved").length;
    const rejected = reviewed.filter((a) => a.state === "rejected").length;
    const approvalRate =
      totalReviews > 0 ? Math.round((approved / totalReviews) * 100) : 0;

    const recent = [...reviewed]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 20);

    const enrichedRecent = await Promise.all(
      recent.map(async (a) => {
        const [team, tournament] = await Promise.all([
          ctx.db.get(a.teamId),
          ctx.db.get(a.tournamentId),
        ]);
        return {
          type: a.type,
          id: a._id,
          state: a.state,
          date: a.date,
          team,
          tournament,
        };
      }),
    );

    return {
      totalReviews,
      approved,
      rejected,
      approvalRate,
      recentReviews: enrichedRecent,
    };
  },
});
