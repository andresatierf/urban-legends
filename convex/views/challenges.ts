import { v } from "convex/values";

import { query } from "../_generated/server";
import { canManageChallenge } from "../authority/core";
import { getCurrentUserOrThrow } from "../users";

export const listByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await canManageChallenge.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });
    const rows = await ctx.db
      .query("challenges")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});
