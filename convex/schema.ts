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
  }).index("by_name", ["name"]),

  teams: defineTable({
    name: v.string(),
    tournamentId: v.id("tournaments"),
    createdBy: v.id("users"),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_tournament_and_name", ["tournamentId", "name"]),

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
    description: v.optional(v.string()),
  }).index("by_name", ["name"]),

  userRoles: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
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
    teammates: v.array(v.id("users")),
    state: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("deleted"),
    ),
    managedBy: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_team_and_date", ["teamId", "date"])
    .index("by_tournament_and_date", ["tournamentId", "date"])
    .index("by_state", ["state"])
    .index("by_user_and_state", ["userId", "state"]),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    externalId: v.string(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_email", ["email"]),
});
