import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireAdmin } from "../authority/core";
import { nowUTC } from "../lib/dates";
import { detectOrphanedRecords } from "../lib/helpers";
import { grant as grantRole } from "../lifecycle/roles";
import type { NotificationEvent } from "../notifications/events";
import { publish as publishNotifications } from "../notifications/notifier";
import { notifyRoleRevoked } from "../notifications/triggers";
import { getCurrentUserOrThrow } from "../users";

/**
 * ADMIN UTILITY - Manual Execution Only
 *
 * Makes the first user in the system an admin. This is a bootstrap function
 * intended to be run once after initial deployment to create the first admin user.
 *
 * **Usage:**
 * 1. Deploy the application
 * 2. Create the first user account via Clerk authentication
 * 3. Run this mutation manually via the Convex dashboard
 * 4. The authenticated user will receive the admin role
 *
 * **Safety:**
 * - Will not create duplicate admins (checks if any admin exists first)
 * - Automatically seeds roles if they don't exist
 * - Returns false if an admin already exists
 *
 * @returns {boolean} true if admin was created, false if admin already exists
 *
 * @internal This function is not exposed to the frontend
 */
export const makeFirstUserAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const adminQuery = ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "admin"));

    let adminRole = await adminQuery.first();

    if (!adminRole) {
      await ctx.runMutation(internal.seed.seedRoles);

      adminRole = await adminQuery.first();

      if (!adminRole) {
        throw new Error("Failed to create admin role");
      }
    }

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
      assignedAt: nowUTC(),
    });

    return true;
  },
});

export const updateRoles = mutation({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    await requireAdmin(ctx, currentUser._id);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const allRoles = await ctx.db.query("roles").collect();
    const roleMap = new Map(allRoles.map((role) => [role.name, role]));

    for (const role of args.roles) {
      if (!roleMap.has(role)) {
        throw new Error(`Role "${role}" not found`);
      }
    }

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

        if (args.userId === currentUser._id) {
          console.warn("Admin removing admin role from self");
        }
      }
    }

    for (const roleName of rolesToRemove) {
      const role = roleMap.get(roleName);
      if (!role) continue;

      const userRole = currentUserRoles.find((ur) => ur.roleId === role._id);
      if (userRole) {
        await ctx.db.delete(userRole._id);

        // Notify user of role revocation
        await notifyRoleRevoked(ctx, {
          userId: args.userId,
          roleName: role.name,
          roleDisplayName: role.displayName || role.name,
        });
      }
    }

    const events: NotificationEvent[] = [];
    for (const roleName of rolesToAdd) {
      const role = roleMap.get(roleName);
      if (!role) continue;

      const grantEvents = await grantRole(ctx, {
        userId: args.userId,
        roleId: role._id,
        assignedBy: currentUser._id,
      });
      events.push(...grantEvents);
    }

    await publishNotifications(ctx, events);

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

export const getAllPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    await requireAdmin(ctx, user._id);

    const pendingActivities = await ctx.db
      .query("activities")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingActivities.length;
  },
});

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    await requireAdmin(ctx, user._id);

    const [users, tournaments, teams, activities] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("tournaments").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("activities").collect(),
    ]);

    const pendingActivities = activities.filter((a) => a.state === "pending");

    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const recentActivities = await ctx.db
      .query("activities")
      .order("desc")
      .take(20);

    const enrichedActivity = await Promise.all(
      recentActivities.map(async (activity) => {
        const [submitter, team, tournament] = await Promise.all([
          ctx.db.get(activity.createdBy),
          ctx.db.get(activity.teamId),
          ctx.db.get(activity.tournamentId),
        ]);

        return {
          id: activity._id,
          type: "activity" as const,
          state: activity.state,
          submitter,
          team,
          tournament,
          createdAt: new Date(activity._creationTime).toISOString(),
        };
      }),
    );

    return {
      stats: {
        totalUsers: users.length,
        totalTournaments: tournaments.length,
        totalTeams: teams.length,
        totalActivities: activities.length,
      },
      pendingActions: {
        pendingActivities: pendingActivities.length,
        joinRequests: joinRequests.length,
      },
      recentActivity: enrichedActivity,
    };
  },
});

/**
 * Get system health information including database metrics and orphaned records.
 * Only accessible to admins.
 */
export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    await requireAdmin(ctx, user._id);

    const [tournaments, teams, activities, users, teamMembers] =
      await Promise.all([
        ctx.db.query("tournaments").collect(),
        ctx.db.query("teams").collect(),
        ctx.db.query("activities").collect(),
        ctx.db.query("users").collect(),
        ctx.db.query("teamMembers").collect(),
      ]);

    const { orphanedTeams, orphanedActivities, orphanedTeamMembers } =
      await detectOrphanedRecords(ctx);

    return {
      services: {
        convex: "healthy",
        clerk: "healthy",
        database: "healthy",
      },
      databaseMetrics: {
        tournaments: {
          total: tournaments.length,
          orphaned: 0,
        },
        teams: {
          total: teams.length,
          orphaned: orphanedTeams.length,
        },
        activities: {
          total: activities.length,
          orphaned: orphanedActivities.length,
        },
        users: {
          total: users.length,
          orphaned: 0,
        },
        teamMembers: {
          total: teamMembers.length,
          orphaned: orphanedTeamMembers.length,
        },
      },
      orphanedRecords: {
        teams: orphanedTeams.map((t) => ({
          id: t._id,
          name: t.name,
          tournamentId: t.tournamentId,
        })),
        activities: orphanedActivities.map((a) => ({
          id: a._id,
          teamId: a.teamId,
          tournamentId: a.tournamentId,
        })),
        teamMembers: orphanedTeamMembers.map((tm) => ({
          id: tm._id,
          teamId: tm.teamId,
          userId: tm.userId,
        })),
      },
      recentErrors: [],
    };
  },
});

/**
 * Run a data integrity check to identify orphaned records.
 * Returns a summary of issues found.
 * Only accessible to admins.
 */
export const runIntegrityCheck = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    await requireAdmin(ctx, user._id);

    const { orphanedTeams, orphanedActivities, orphanedTeamMembers } =
      await detectOrphanedRecords(ctx);

    const issuesFound = {
      orphanedTeams: orphanedTeams.length,
      orphanedActivities: orphanedActivities.length,
      orphanedTeamMembers: orphanedTeamMembers.length,
    };

    const totalIssues =
      issuesFound.orphanedTeams +
      issuesFound.orphanedActivities +
      issuesFound.orphanedTeamMembers;

    return {
      success: true,
      issuesFound,
      totalIssues,
      message:
        totalIssues === 0
          ? "No integrity issues found"
          : `Found ${totalIssues} integrity issue${totalIssues === 1 ? "" : "s"}`,
    };
  },
});

/**
 * Clean up orphaned records from the database.
 * This is a destructive operation that permanently deletes orphaned data.
 * Only accessible to admins.
 */
export const cleanupOrphanedRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    await requireAdmin(ctx, user._id);

    const { orphanedTeams, orphanedActivities, orphanedTeamMembers } =
      await detectOrphanedRecords(ctx);

    let deletedCount = 0;

    for (const tm of orphanedTeamMembers) {
      await ctx.db.delete(tm._id);
      deletedCount++;
    }

    for (const a of orphanedActivities) {
      await ctx.db.delete(a._id);
      deletedCount++;
    }

    for (const t of orphanedTeams) {
      await ctx.db.delete(t._id);
      deletedCount++;
    }

    return {
      success: true,
      deletedCount,
      message:
        deletedCount === 0
          ? "No orphaned records to clean up"
          : `Successfully deleted ${deletedCount} orphaned record${deletedCount === 1 ? "" : "s"}`,
    };
  },
});
