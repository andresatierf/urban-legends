import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const userRole = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (userRole?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db.query("competitions").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    return await ctx.db.insert("competitions", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("competitions"),
    name: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: args.isActive,
    });
  },
});

export const getById = query({
  args: { id: v.id("competitions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(args.id);
  },
});

export const getLeaderboard = query({
  args: { competitionId: v.id("competitions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();

    const leaderboard = [];

    for (const team of teams) {
      const completions = await ctx.db
        .query("dailyCompletions")
        .withIndex("by_team_and_date", (q) => q.eq("teamId", team._id))
        .filter((q) => q.eq(q.field("completed"), true))
        .collect();

      // Group by date to count unique days
      const uniqueDays = new Set(completions.map(c => c.date));

      leaderboard.push({
        team,
        completedDays: uniqueDays.size,
      });
    }

    return leaderboard.sort((a, b) => b.completedDays - a.completedDays);
  },
});
