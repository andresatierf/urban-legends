import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const roles = await ctx.db
      .query("roles")
      .filter((q) =>
        q.or(
          ...userRoles.map((ur) => q.eq(q.field("_id"), ur.roleId as string)),
        ),
      )
      .collect();

    return roles.map((r) => r.name);
  },
});
