import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { hasSomeReviewAccess, requireAdmin } from "../authority/core";
import { getCurrentUserOrThrow } from "../users";

async function countPendingSubmissions(ctx: QueryCtx): Promise<number> {
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
}

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeReviewAccess(ctx, user._id))) {
      return 0;
    }

    return countPendingSubmissions(ctx);
  },
});

export const getAllPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    await requireAdmin(ctx, user._id);

    return countPendingSubmissions(ctx);
  },
});
