import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { rolesToCreate, teamsData } from "./data";
import { nowUTC } from "./lib/dates";

/**
 * Seed mutation to populate the database with sample tournament and teams.
 * This creates a tournament with real team data and assigns users to teams.
 *
 * Admin only. Run this mutation from the Convex dashboard or CLI.
 */
export const seedTournamentAndTeams = internalMutation({
  args: {
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Tournament 2024";

    // Check if tournament already exists
    const existingTournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();

    if (existingTournament) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    // Create tournament
    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Sample tournament with seeded teams and participants",
      startDate: new Date("2025-09-12").toISOString(),
      endDate: new Date("2025-12-12").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: "kh776hrvgra829xcxgf7hj7kzn7t3ny0" as Id<"users">,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    // Team data from the screenshot

    const createdTeams = [];

    for (const teamData of teamsData) {
      // Create or get captain user
      const captainUser = await getOrCreateUser(ctx, {
        name: teamData.captain.name,
        email: teamData.captain.email,
      });

      // Create team
      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        tournamentId,
        createdBy: captainUser._id,
        visibility: "public",
        points: 0,
      });

      // Add captain as team member
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: captainUser._id,
        role: "captain",
      });

      // Create or get member users and add them to team
      for (const memberData of teamData.members) {
        const memberUser = await getOrCreateUser(ctx, {
          name: memberData.name,
          email: memberData.email,
        });

        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberUser._id,
          role: "member",
        });
      }

      createdTeams.push({
        teamId,
        teamName: teamData.name,
        captainName: teamData.captain.name,
        memberCount: teamData.members.length + 1, // +1.f captain
      });
    }

    return {
      tournamentId,
      tournamentName,
      teamsCreated: createdTeams.length,
      teams: createdTeams,
    };
  },
});

/**
 * Helper function to get or create a user by email.
 * If user doesn't exist, creates a new user with a placeholder externalId.
 */
async function getOrCreateUser(
  ctx: MutationCtx,
  userData: { name: string; email: string },
) {
  // Check if user exists by email
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", userData.email))
    .first();

  if (existingUser) {
    return existingUser;
  }

  // Create new user with placeholder externalId
  // In production, these would be synced from Clerk
  const userId = await ctx.db.insert("users", {
    name: userData.name,
    email: userData.email,
    externalId: `seed_${userData.email.replace(/[^a-z0-9]/gi, "_")}`,
  });

  // Assign default "player" role
  const userRole = await ctx.db
    .query("roles")
    .withIndex("by_name", (q) => q.eq("name", "player"))
    .first();

  if (userRole) {
    await ctx.db.insert("userRoles", {
      userId,
      roleId: userRole._id,
      assignedAt: nowUTC(),
    });
  }

  return (await ctx.db.get(userId)) as NonNullable<Doc<"users">>;
}

/**
 * Clear all seeded data (teams, team members, and users with seed_ externalId prefix).
 * Tournament must be specified by name. Admin only.
 */
export const clearSeededData = internalMutation({
  args: {
    tournamentName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find tournament
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", args.tournamentName))
      .first();

    if (!tournament) {
      throw new Error(`Tournament "${args.tournamentName}" not found`);
    }

    // Get all teams for this tournament
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .collect();

    let deletedTeamMembers = 0;
    let deletedSubmissions = 0;

    // Delete team members and submissions for each team
    for (const team of teams) {
      // Delete team members
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      for (const member of teamMembers) {
        await ctx.db.delete(member._id);
        deletedTeamMembers++;
      }

      // Delete submissions
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      for (const submission of submissions) {
        await ctx.db.delete(submission._id);
        deletedSubmissions++;
      }

      // Delete team
      await ctx.db.delete(team._id);
    }

    // Delete seeded users (those with externalId starting with "seed_")
    const allUsers = await ctx.db.query("users").collect();
    let deletedUsers = 0;

    for (const userDoc of allUsers) {
      if (userDoc.externalId.startsWith("seed_")) {
        // Delete user roles first
        const userRoles = await ctx.db
          .query("userRoles")
          .withIndex("by_user", (q) => q.eq("userId", userDoc._id))
          .collect();

        for (const userRole of userRoles) {
          await ctx.db.delete(userRole._id);
        }

        // Delete user
        await ctx.db.delete(userDoc._id);
        deletedUsers++;
      }
    }

    // Delete tournament
    await ctx.db.delete(tournament._id);

    return {
      tournamentDeleted: args.tournamentName,
      teamsDeleted: teams.length,
      teamMembersDeleted: deletedTeamMembers,
      submissionsDeleted: deletedSubmissions,
      usersDeleted: deletedUsers,
    };
  },
});

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
