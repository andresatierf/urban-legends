import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tournaments: defineTable({
    name: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    teamMinSize: v.optional(v.number()),
    teamMaxSize: v.optional(v.number()),
    createdBy: v.id("users"),
    winnerId: v.optional(v.id("teams")),
    completedAt: v.optional(v.string()),
    scoringConfig: v.object({
      individualPoints: v.object({
        base: v.number(),
        advanced: v.number(),
      }),
      teamExercisePoints: v.object({
        base: v.number(),
        advanced: v.number(),
      }),
      teamExerciseThreshold: v.number(),
    }),
    maxSubmissionsPerDay: v.optional(v.number()), // Limit submissions per user per day
  }).index("by_name", ["name"]),

  teams: defineTable({
    name: v.string(),
    tournamentId: v.id("tournaments"),
    createdBy: v.id("users"),
    visibility: v.union(v.literal("public"), v.literal("private")),
    maxMembers: v.optional(v.number()),
    points: v.number(),
    lastActivityAt: v.optional(v.string()),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_tournament_and_name", ["tournamentId", "name"])
    .index("by_tournament_and_points", ["tournamentId", "points"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("captain")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  roles: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    hierarchy: v.number(), // Lower number = more access (0 = highest)
  }).index("by_name", ["name"]),

  userRoles: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    assignedBy: v.optional(v.id("users")),
    assignedAt: v.optional(v.string()),
  })
    .index("by_user_role", ["userId", "roleId"])
    .index("by_user", ["userId"])
    .index("by_role", ["roleId"]),

  submissions: defineTable({
    userId: v.id("users"),
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
    date: v.string(),
    description: v.optional(v.string()),
    teammates: v.optional(v.array(v.id("users"))), // Optional during migration
    submissionType: v.optional(
      v.union(v.literal("individual"), v.literal("team")),
    ), // NEW - optional during migration
    state: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("deleted"),
    ),
    createdBy: v.id("users"),
    managedBy: v.optional(v.id("users")),
    // Scoring fields
    tier: v.union(v.literal("base"), v.literal("advanced")),
    pointsEarned: v.number(), // Calculated when approved
    submissionGroupId: v.optional(v.id("submissionGroups")), // NEW - reference to group
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_team", ["teamId"])
    .index("by_team_and_user", ["teamId", "userId"])
    .index("by_team_and_date", ["teamId", "date"])
    .index("by_team_and_type", ["teamId", "submissionType"]) // NEW
    .index("by_tournament_and_date", ["tournamentId", "date"])
    .index("by_state", ["state"])
    .index("by_user_and_state", ["userId", "state"])
    .index("by_group", ["submissionGroupId"]), // NEW

  submissionGroups: defineTable({
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
    date: v.string(), // YYYY-MM-DD
    state: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("deleted"),
    ),
    tier: v.union(v.literal("base"), v.literal("advanced")), // Derived from submissions (highest tier wins)
    participantCount: v.number(), // How many members submitted for this team activity
    totalTeamMembers: v.number(), // Team size at time of submission
    participationRate: v.number(), // participantCount / totalTeamMembers
    isTeamExercise: v.boolean(), // participationRate >= threshold
    pointsEarned: v.number(), // Total points for team (calculated on approval)
    managedBy: v.optional(v.id("users")), // Admin who approved/rejected
    createdAt: v.string(), // First submission in group
    updatedAt: v.string(), // Last modification
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_date", ["teamId", "date"]) // Ensures uniqueness: one group per team per date
    .index("by_tournament_and_date", ["tournamentId", "date"])
    .index("by_state", ["state"]),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    externalId: v.string(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_email", ["email"]),

  teamInvitations: defineTable({
    teamId: v.id("teams"),
    invitedUserId: v.id("users"),
    invitedEmail: v.string(),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),
    expiresAt: v.string(), // ISO date
    createdAt: v.string(),
    respondedAt: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["invitedUserId"])
    .index("by_email", ["invitedEmail"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["invitedUserId", "status"])
    .index("by_team_and_user_and_status", [
      "teamId",
      "invitedUserId",
      "status",
    ]),

  joinRequests: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    message: v.optional(v.string()), // User's message to team
    createdAt: v.string(),
    respondedAt: v.optional(v.string()),
    respondedBy: v.optional(v.id("users")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_team_and_user", ["teamId", "userId"])
    .index("by_team_and_user_and_status", ["teamId", "userId", "status"]),
});
