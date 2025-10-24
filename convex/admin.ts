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
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUserRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect();

    const currentUserRoleNames = await Promise.all(
      currentUserRoles.map(({ roleId }) => ctx.db.get(roleId)),
    );

    if (!currentUserRoleNames.map((r) => r?.name).includes("admin")) {
      throw new Error("Admin access required");
    }

    // Get the role ID for the target role
    const targetRole = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.role))
      .first();

    if (!targetRole) {
      throw new Error("Role not found");
    }

    // Remove existing roles for this user
    const existingRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const existingRole of existingRoles) {
      await ctx.db.delete(existingRole._id);
    }

    // Add the new role
    await ctx.db.insert("userRoles", {
      userId: args.userId,
      roleId: targetRole._id,
    });
  },
});
