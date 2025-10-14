import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export const makeFirstUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const adminRole = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "admin"))
      .first();

    let roleId: Id<"roles">;
    if (adminRole) {
      roleId = adminRole._id;
    } else {
      roleId = await ctx.db.insert("roles", {
        name: "admin",
        description: "auto-generated",
      });
    }

    // Check if any admin exists
    const existingAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_role", (q) => q.eq("roleId", roleId))
      .first();

    if (existingAdmin) {
      return false; // Admin already exists
    }

    await ctx.db.insert("userRoles", { userId, roleId });

    return true;
  },
});

export const addUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
  },
  handler: async () => {},
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // const currentUserId = await getAuthUserId(ctx);
    // if (!currentUserId) {
    //   throw new Error("Not authenticated");
    // }
    //
    // // Check if current user is admin
    // const currentUserRole = await ctx.db
    //   .query("userRoles")
    //   .withIndex("by_user", (q: any) => q.eq("userId", currentUserId))
    //   .first();
    //
    // if (currentUserRole?.role !== "admin") {
    //   throw new Error("Admin access required");
    // }
    //
    // // Update or create user role
    // const existingRole = await ctx.db
    //   .query("userRoles")
    //   .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
    //   .first();
    //
    // if (existingRole) {
    //   await ctx.db.patch(existingRole._id, { role: args.role });
    // } else {
    //   await ctx.db.insert("userRoles", {
    //     userId: args.userId,
    //     role: args.role,
    //   });
    // }
  },
});
