import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  competitions: defineTable({
    name: v.string(),
    description: v.string(),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    isActive: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_active", ["isActive"]),

  teams: defineTable({
    name: v.string(),
    competitionId: v.id("competitions"),
    createdBy: v.id("users"),
  }).index("by_competition", ["competitionId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("captain")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  }).index("by_user", ["userId"]),

  dailyCompletions: defineTable({
    userId: v.id("users"),
    teamId: v.id("teams"),
    competitionId: v.id("competitions"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    completed: v.boolean(),
    teammates: v.array(v.id("users")), // IDs of teammates who completed together
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_team_and_date", ["teamId", "date"])
    .index("by_competition_and_date", ["competitionId", "date"]),
};

export default defineSchema({
  // ...authTables,
  ...applicationTables,
});
