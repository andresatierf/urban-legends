import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

/**
 * Get the count of pending submissions (both individual and groups) for reviewers.
 * Only accessible to users with reviewer or admin roles.
 */
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user has reviewer or admin role
    if (
      !user.roleNames.includes("reviewer") &&
      !user.roleNames.includes("admin")
    ) {
      return 0;
    }

    // Count all pending individual submissions
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count all pending submission groups (team activities)
    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});

/**
 * Get the count of flagged submissions needing attention.
 * This is a future feature - currently returns 0.
 */
export const getFlaggedCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (
      !user.roleNames.includes("reviewer") &&
      !user.roleNames.includes("admin")
    ) {
      return 0;
    }

    // Flagged submissions feature not yet implemented
    // TODO: Add flagged submissions tracking in future
    return 0;
  },
});
