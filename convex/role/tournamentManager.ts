import { query } from "../_generated/server";
import { hasSomeTournamentManagerAccess } from "../authority/core";
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

    if (!(await hasSomeTournamentManagerAccess(ctx, user._id))) {
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
