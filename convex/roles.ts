import { internalMutation } from "./_generated/server";

/**
 * Internal mutation to seed the roles table with system roles.
 * This should be run once to initialize the roles in the database.
 *
 * Roles:
 * - admin: Full system access
 * - player: Basic user access (default role for all users)
 * - tournament_manager: Can create and manage tournaments
 * - reviewer: Can review submissions and moderate content
 * - viewer: Read-only access to analytics
 */
export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rolesToCreate = [
      {
        name: "dev",
        displayName: "Developer",
        description:
          "Full system access - can manage all tournaments, users, teams, and system settings. This role is reserved for developers only.",
        hierarchy: 0,
      },
      {
        name: "admin",
        displayName: "Administrator",
        description:
          "Full system access - can manage all tournaments, users, teams, and system settings",
        hierarchy: 1,
      },
      {
        name: "tournament_manager",
        displayName: "Tournament Manager",
        description:
          "Can create and manage tournaments, approve submissions, and view analytics for their tournaments",
        hierarchy: 2,
      },
      {
        name: "reviewer",
        displayName: "Reviewer",
        description:
          "Can review and approve/reject submissions across all tournaments, moderate content, and handle disputes",
        hierarchy: 3,
      },
      {
        name: "player",
        displayName: "Player",
        description:
          "Basic user access - can join teams and participate in tournaments",
        hierarchy: 4,
      },
      {
        name: "viewer",
        displayName: "Viewer",
        description:
          "Read-only access to tournament statistics, leaderboards, and analytics",
        hierarchy: 5,
      },
    ];

    const createdRoles = [];

    for (const roleData of rolesToCreate) {
      // Check if role already exists
      const existingRole = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", roleData.name))
        .first();

      if (!existingRole) {
        const roleId = await ctx.db.insert("roles", roleData);
        createdRoles.push({ id: roleId, ...roleData, created: true });
      } else {
        // Update all fields if role exists
        await ctx.db.patch(existingRole._id, {
          displayName: roleData.displayName,
          description: roleData.description,
          hierarchy: roleData.hierarchy,
        });
        createdRoles.push({ id: existingRole._id, ...roleData, updated: true });
      }
    }

    return {
      success: true,
      roles: createdRoles,
    };
  },
});
