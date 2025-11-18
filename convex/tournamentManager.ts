import { query } from "./_generated/server";
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

    if (
      !["admin", "tournament_manager"].some((r) => user.roleNames.includes(r))
    ) {
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
