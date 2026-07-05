import { query } from "../_generated/server";
import { hasSomeTournamentManagerAccess } from "../authority/core";
import { getCurrentUserOrThrow } from "../users";

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeTournamentManagerAccess(ctx, user._id))) {
      return 0;
    }

    const pendingActivities = await ctx.db
      .query("activities")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingActivities.length;
  },
});
