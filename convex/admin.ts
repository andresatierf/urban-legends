import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const makeFirstUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if any admin exists
    const existingAdmin = await ctx.db
      .query("userRoles")
      .filter((q: any) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      return false; // Admin already exists
    }

    // Make this user an admin
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (existingRole) {
      await ctx.db.patch(existingRole._id, { role: "admin" });
    } else {
      await ctx.db.insert("userRoles", {
        userId,
        role: "admin",
      });
    }

    return true; // User was made admin
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUserRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUserId))
      .first();

    if (currentUserRole?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Update or create user role
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (existingRole) {
      await ctx.db.patch(existingRole._id, { role: args.role });
    } else {
      await ctx.db.insert("userRoles", {
        userId: args.userId,
        role: args.role,
      });
    }
  },
});
