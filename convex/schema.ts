import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  competitionTypes: defineTable({
    // Identity
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    version: v.number(),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("deprecated"),
      v.literal("archived"),
    ),

    // Submission Schema Definition
    submissionSchema: v.object({
      fields: v.array(
        v.object({
          name: v.string(),
          type: v.union(
            v.literal("string"),
            v.literal("number"),
            v.literal("boolean"),
            v.literal("enum"),
            v.literal("date"),
            v.literal("time"),
            v.literal("images"),
            v.literal("location"),
            v.literal("url"),
          ),
          label: v.string(),
          required: v.boolean(),
          defaultValue: v.optional(v.any()),

          // Type-specific constraints
          constraints: v.optional(
            v.object({
              min: v.optional(v.number()),
              max: v.optional(v.number()),
              minLength: v.optional(v.number()),
              maxLength: v.optional(v.number()),
              pattern: v.optional(v.string()),
              enum: v.optional(v.array(v.string())),
              minItems: v.optional(v.number()),
              maxItems: v.optional(v.number()),
              fileTypes: v.optional(v.array(v.string())),
              maxFileSize: v.optional(v.number()),
              step: v.optional(v.number()),
            }),
          ),

          // UI hints
          uiHints: v.optional(
            v.object({
              placeholder: v.optional(v.string()),
              helpText: v.optional(v.string()),
              displayOrder: v.optional(v.number()),
              displayVariant: v.optional(v.string()),
            }),
          ),
        }),
      ),
    }),

    // Scoring Configuration
    scoringConfig: v.object({
      method: v.union(
        v.literal("fixed"),
        v.literal("formula"),
        v.literal("ranked"),
        v.literal("cumulative"),
        v.literal("custom"),
      ),
      config: v.any(),
    }),

    // Validation Rules
    validationRules: v.array(
      v.object({
        type: v.union(
          v.literal("required"),
          v.literal("numeric_range"),
          v.literal("string_length"),
          v.literal("enum_value"),
          v.literal("custom"),
        ),
        field: v.optional(v.string()),
        config: v.any(),
        errorMessage: v.string(),
      }),
    ),

    // Features
    features: v.object({
      supportsTeamSubmissions: v.boolean(),
      supportsIndividualSubmissions: v.boolean(),
      requiresApproval: v.boolean(),
      supportsRevisions: v.boolean(),
      supportsTiers: v.boolean(),
    }),

    // UI Component Mapping
    uiComponents: v.object({
      formComponent: v.optional(v.string()),
      cardComponent: v.optional(v.string()),
      detailComponent: v.optional(v.string()),
      leaderboardComponent: v.optional(v.string()),
    }),

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),

    // Legacy support
    isBuiltIn: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_slug_and_version", ["slug", "version"]),

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

    // NEW: Competition Type Reference
    competitionTypeId: v.optional(v.id("competitionTypes")),
    competitionTypeSlug: v.optional(v.string()),
    competitionTypeVersion: v.optional(v.number()),

    // NEW: Override scoring config (optional)
    scoringConfigOverride: v.optional(v.any()),

    // MODIFIED: Make optional (not all types use this)
    scoringConfig: v.optional(
      v.object({
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
    ),
    maxSubmissionsPerDay: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_competition_type", ["competitionTypeId"])
    .index("by_competition_type_slug", ["competitionTypeSlug"]),

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
    hierarchy: v.number(),
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

    // MODIFIED: Make optional (not all competition types differentiate individual/team)
    submissionType: v.optional(
      v.union(v.literal("individual"), v.literal("team")),
    ),

    state: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("deleted"),
    ),
    createdBy: v.id("users"),
    managedBy: v.optional(v.id("users")),

    // MODIFIED: Make optional (not all competition types use tiers)
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),

    pointsEarned: v.number(),
    submissionGroupId: v.optional(v.id("submissionGroups")),

    // NEW: Flexible data field (JSON)
    data: v.optional(v.any()),

    // NEW: Metadata about scoring
    scoringMetadata: v.optional(
      v.object({
        scoringMethod: v.string(),
        calculatedAt: v.string(),
        rawMetrics: v.optional(v.any()),
        scoringVersion: v.optional(v.number()),
      }),
    ),
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
    expiresAt: v.string(),
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
    message: v.optional(v.string()),
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
