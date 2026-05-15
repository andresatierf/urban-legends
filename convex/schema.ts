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
    maxSubmissionsPerDay: v.optional(v.number()),
  }).index("by_name", ["name"]),

  teams: defineTable({
    name: v.string(),
    tournamentId: v.id("tournaments"),
    createdBy: v.id("users"),
    joinPolicy: v.union(v.literal("open"), v.literal("closed")),
    maxMembers: v.optional(v.number()),
    points: v.number(),
    lastActivityAt: v.optional(v.string()),
    recentActivity: v.optional(
      v.object({
        updatedAt: v.string(),
        days: v.array(
          v.object({
            date: v.string(),
            approved: v.number(),
            pending: v.number(),
            rejected: v.number(),
            points: v.optional(v.number()),
          }),
        ),
      }),
    ),
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
    hierarchy: v.number(),
  }).index("by_name", ["name"]),

  tournamentRoles: defineTable({
    userId: v.id("users"),
    tournamentId: v.id("tournaments"),
    role: v.union(v.literal("tournament_manager"), v.literal("reviewer")),
  })
    .index("by_user", ["userId"])
    .index("by_tournament", ["tournamentId"])
    .index("by_user_and_tournament", ["userId", "tournamentId"])
    .index("by_user_tournament_role", ["userId", "tournamentId", "role"]),

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
    submissionType: v.union(v.literal("individual"), v.literal("team")),
    state: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("deleted"),
    ),
    createdBy: v.id("users"),
    managedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    tier: v.union(v.literal("base"), v.literal("advanced")),
    pointsEarned: v.number(),
    submissionGroupId: v.optional(v.id("submissionGroups")),
    evidenceStorageIds: v.optional(v.array(v.id("_storage"))),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_team", ["teamId"])
    .index("by_team_and_user", ["teamId", "userId"])
    .index("by_team_and_date", ["teamId", "date"])
    .index("by_team_and_type", ["teamId", "submissionType"])
    .index("by_tournament_and_date", ["tournamentId", "date"])
    .index("by_state", ["state"])
    .index("by_user_and_state", ["userId", "state"])
    .index("by_group", ["submissionGroupId"]),

  submissionGroups: defineTable({
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
    date: v.string(),
    state: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("deleted"),
    ),
    tier: v.union(v.literal("base"), v.literal("advanced")),
    participantCount: v.number(),
    totalTeamMembers: v.number(),
    participationRate: v.number(),
    isTeamExercise: v.boolean(),
    pointsEarned: v.number(),
    managedBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_date", ["teamId", "date"])
    .index("by_tournament_and_date", ["tournamentId", "date"])
    .index("by_state", ["state"]),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    externalId: v.string(),
    imageUrl: v.optional(v.string()),
  })
    .index("by_external_id", ["externalId"])
    .index("by_email", ["email"]),

  joinRequests: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),
    message: v.optional(v.string()),
    createdAt: v.string(),
    respondedAt: v.optional(v.string()),
    respondedBy: v.optional(v.id("users")),
    initiator: v.union(v.literal("user"), v.literal("team")),
    createdBy: v.id("users"),
    expiresAt: v.string(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_team_and_user", ["teamId", "userId"])
    .index("by_team_and_user_and_status", ["teamId", "userId", "status"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_createdBy_and_status", ["createdBy", "status"]),

  pendingUploads: defineTable({
    storageId: v.id("_storage"),
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    isRead: v.boolean(),
    isDeleted: v.optional(v.boolean()),
    createdAt: v.string(),
    actionUrl: v.optional(v.string()),
    actionMetadata: v.optional(v.any()),
  })
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_user_and_deleted", ["userId", "isDeleted"])
    .index("by_createdAt", ["createdAt"])
    .index("by_user_type_entity", [
      "userId",
      "type",
      "relatedEntityType",
      "relatedEntityId",
    ]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    enabledTypes: v.optional(v.array(v.string())),
    dailyDigestEnabled: v.boolean(),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
    timezone: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),
});
