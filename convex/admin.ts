import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { nowUTC } from "./lib/dates";
import { detectOrphanedRecords } from "./lib/helpers";
import { validateMinimumRole } from "./roles";
import { getCurrentUserOrThrow } from "./users";

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

    validateMinimumRole(currentUser, "admin");

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
        assignedAt: nowUTC(),
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

/**
 * Get the count of all pending submissions system-wide.
 * This includes both individual submissions and submission groups.
 * Only accessible to admins.
 */
export const getAllPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateMinimumRole(user, "admin");

    // Count all pending individual submissions
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count all pending submission groups
    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});

/**
 * Get comprehensive dashboard data for admin.
 * Returns system-wide statistics, pending actions, and recent activity.
 */
export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateMinimumRole(user, "admin");

    // Get system-wide counts
    const [users, tournaments, teams, submissions] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("tournaments").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("submissions").collect(),
    ]);

    // Get pending submissions (individual + groups)
    const [pendingIndividual, pendingGroups] = await Promise.all([
      ctx.db
        .query("submissions")
        .withIndex("by_state", (q) => q.eq("state", "pending"))
        .filter((q) => q.eq(q.field("submissionType"), "individual"))
        .collect(),
      ctx.db
        .query("submissionGroups")
        .withIndex("by_state", (q) => q.eq("state", "pending"))
        .collect(),
    ]);

    // Get all pending join requests
    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Get recent activity (last 20 submissions)
    const recentSubmissions = await ctx.db
      .query("submissions")
      .order("desc")
      .take(20);

    // Enrich recent submissions with user, team, and tournament data
    const enrichedActivity = await Promise.all(
      recentSubmissions.map(async (submission) => {
        const [submitter, team, tournament] = await Promise.all([
          ctx.db.get(submission.userId),
          ctx.db.get(submission.teamId),
          ctx.db.get(submission.tournamentId),
        ]);

        return {
          id: submission._id,
          type: "submission" as const,
          state: submission.state,
          submitter,
          team,
          tournament,
          createdAt: new Date(submission._creationTime).toISOString(),
        };
      }),
    );

    return {
      stats: {
        totalUsers: users.length,
        totalTournaments: tournaments.length,
        totalTeams: teams.length,
        totalSubmissions: submissions.length,
      },
      pendingActions: {
        pendingSubmissions: pendingIndividual.length + pendingGroups.length,
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
    validateMinimumRole(user, "admin");

    // Get all entities for metrics
    const [tournaments, teams, submissions, users, teamMembers] =
      await Promise.all([
        ctx.db.query("tournaments").collect(),
        ctx.db.query("teams").collect(),
        ctx.db.query("submissions").collect(),
        ctx.db.query("users").collect(),
        ctx.db.query("teamMembers").collect(),
      ]);

    // Detect orphaned records using helper
    const { orphanedTeams, orphanedSubmissions, orphanedTeamMembers } =
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
        submissions: {
          total: submissions.length,
          orphaned: orphanedSubmissions.length,
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
        submissions: orphanedSubmissions.map((s) => ({
          id: s._id,
          teamId: s.teamId,
          tournamentId: s.tournamentId,
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
    validateMinimumRole(user, "admin");

    const { orphanedTeams, orphanedSubmissions, orphanedTeamMembers } =
      await detectOrphanedRecords(ctx);

    const issuesFound = {
      orphanedTeams: orphanedTeams.length,
      orphanedSubmissions: orphanedSubmissions.length,
      orphanedTeamMembers: orphanedTeamMembers.length,
    };

    const totalIssues =
      issuesFound.orphanedTeams +
      issuesFound.orphanedSubmissions +
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
    validateMinimumRole(user, "admin");

    const { orphanedTeams, orphanedSubmissions, orphanedTeamMembers } =
      await detectOrphanedRecords(ctx);

    let deletedCount = 0;

    // Delete orphaned team members
    for (const tm of orphanedTeamMembers) {
      await ctx.db.delete(tm._id);
      deletedCount++;
    }

    // Delete orphaned submissions
    for (const s of orphanedSubmissions) {
      await ctx.db.delete(s._id);
      deletedCount++;
    }

    // Delete orphaned teams
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
