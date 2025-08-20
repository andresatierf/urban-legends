import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Check if current user is admin
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const users = await ctx.db.query("users").collect();
    const usersWithRoles = [];

    for (const user of users) {
      const role = await ctx.db
        .query("userRoles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      usersWithRoles.push({
        ...user,
        role: role?.role || "user",
      });
    }

    return usersWithRoles;
  },
});
