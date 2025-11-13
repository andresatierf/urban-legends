import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

export const makeFirstUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const adminQuery = ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "admin"));

    let adminRole = await adminQuery.first();

    if (!adminRole) {
      await ctx.runMutation(internal.roles.seedRoles);

      adminRole = await adminQuery.first();

      if (!adminRole) {
        throw new Error("Failed to create admin role");
      }
    }

    // Check if any admin exists
    const existingAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_role", (q) => q.eq("roleId", adminRole._id))
      .first();

    if (existingAdmin) {
      return false;
    }

    await ctx.db.insert("userRoles", {
      userId: user._id,
      roleId: adminRole._id,
      assignedBy: user._id,
      assignedAt: new Date().toISOString(),
    });

    return true;
  },
});

export const addUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(currentUser);

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Get role by name
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) {
      throw new Error(`Role "${args.roleName}" not found`);
    }

    // Check if user already has this role
    const existingUserRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q) =>
        q.eq("userId", args.userId).eq("roleId", role._id),
      )
      .first();

    if (existingUserRole) {
      throw new Error("User already has this role");
    }

    // Add role
    await ctx.db.insert("userRoles", {
      userId: args.userId,
      roleId: role._id,
      assignedBy: currentUser._id,
      assignedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const removeUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(currentUser);

    // Get role by name
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) {
      throw new Error(`Role "${args.roleName}" not found`);
    }

    // Special check: cannot remove "user" role
    if (args.roleName === "user") {
      throw new Error("Cannot remove basic user role");
    }

    // Special check: cannot remove last admin
    if (args.roleName === "admin") {
      const adminCount = await ctx.db
        .query("userRoles")
        .withIndex("by_role", (q) => q.eq("roleId", role._id))
        .collect();

      if (adminCount.length <= 1) {
        throw new Error("Cannot remove last admin user");
      }

      // Warn if removing admin from self (but allow it)
      if (args.userId === currentUser._id) {
        console.warn("Admin removing admin role from self");
      }
    }

    // Find and remove userRole
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q) =>
        q.eq("userId", args.userId).eq("roleId", role._id),
      )
      .first();

    if (!userRole) {
      throw new Error("User does not have this role");
    }

    await ctx.db.delete(userRole._id);

    return { success: true };
  },
});

export const updateRoles = mutation({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(currentUser);

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Get all roles from the database
    const allRoles = await ctx.db.query("roles").collect();
    const roleMap = new Map(allRoles.map((role) => [role.name, role]));

    // Validate that all requested roles exist
    for (const role of args.roles) {
      if (!roleMap.has(role)) {
        throw new Error(`Role "${role}" not found`);
      }
    }

    // Get current user roles
    const currentUserRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const currentRoleNames = new Set(
      currentUserRoles.map((ur) => {
        const role = allRoles.find((r) => r._id === ur.roleId);
        if (!role) throw new Error("Role not found");
        return role.name;
      }),
    );

    // Determine roles to add and remove
    const rolesToAdd = args.roles.filter((name) => !currentRoleNames.has(name));
    const rolesToRemove = Array.from(currentRoleNames).filter(
      (name) => !args.roles.includes(name),
    );

    // Special check: if removing admin, ensure it's not the last admin
    if (rolesToRemove.includes("admin")) {
      const adminRole = roleMap.get("admin");
      if (adminRole) {
        const adminCount = await ctx.db
          .query("userRoles")
          .withIndex("by_role", (q) => q.eq("roleId", adminRole._id))
          .collect();

        if (adminCount.length <= 1) {
          throw new Error("Cannot remove last admin user");
        }

        // Warn if removing admin from self (but allow it)
        if (args.userId === currentUser._id) {
          console.warn("Admin removing admin role from self");
        }
      }
    }

    // Remove roles that are no longer needed
    for (const roleName of rolesToRemove) {
      const role = roleMap.get(roleName);
      if (!role) continue;

      const userRole = currentUserRoles.find((ur) => ur.roleId === role._id);
      if (userRole) {
        await ctx.db.delete(userRole._id);
      }
    }

    // Add new roles
    for (const roleName of rolesToAdd) {
      const role = roleMap.get(roleName);
      if (!role) continue;

      await ctx.db.insert("userRoles", {
        userId: args.userId,
        roleId: role._id,
        assignedBy: currentUser._id,
        assignedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      added: rolesToAdd,
      removed: rolesToRemove,
    };
  },
});

export const listRoles = query({
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);

    const roles = await ctx.db.query("roles").collect();

    // For each role, count how many users have it
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await ctx.db
          .query("userRoles")
          .withIndex("by_role", (q) => q.eq("roleId", role._id))
          .collect();

        return {
          ...role,
          userCount: userCount.length,
        };
      }),
    );

    return rolesWithCounts;
  },
});
