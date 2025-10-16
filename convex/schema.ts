import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  tournaments: defineTable({
    name: v.string(),
    description: v.string(),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    isActive: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_active", ["isActive"]),

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
    date: v.string(), // ISO date string (YYYY-MM-DD)
    completed: v.boolean(),
    teammates: v.array(v.id("users")), // IDs of teammates who completed together
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_team_and_date", ["teamId", "date"])
    .index("by_tournament_and_date", ["tournamentId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
