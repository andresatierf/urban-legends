import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

async function requireAdmin(ctx: GenericMutationCtx<DataModel>) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const roles = await Promise.all(
    userRoles.map(({ roleId }) => ctx.db.get(roleId)),
  );

  if (!roles.map((r) => r?.name).includes("admin")) {
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

    const tournaments = await ctx.db.query("tournaments").collect();

    const nowIso = new Date().toISOString();
    return tournaments.toSorted((a, b) => {
      const isActive = (x: typeof a) =>
        x.startDate <= nowIso && x.endDate >= nowIso;
      const isFuture = (x: typeof a) => x.startDate > nowIso;
      const isEnded = (x: typeof a) => x.endDate < nowIso;

      if (
        (isActive(a) && isActive(b)) ||
        (isFuture(a) && isFuture(b)) ||
        (isEnded(a) && isEnded(b))
      )
        return b.startDate.localeCompare(a.startDate);

      if (isActive(a)) return -1;

      if (isActive(b)) return 1;

      if (isFuture(a)) return -1;

      if (isFuture(b)) return 1;

      return 0;
    });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    return await ctx.db.insert("tournaments", {
      name: args.name,
      description: args.description || "",
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
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
    });
  },
});

export const getByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

export const getById = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(args.tournamentId);
  },
});

export const getLeaderboard = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const leaderboard = [];

    for (const team of teams) {
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_team_and_date", (q) => q.eq("teamId", team._id))
        .filter((q) => q.eq(q.field("state"), "approved"))
        .collect();

      // Group by date to count unique days
      const uniqueDays = new Set(submissions.map((c) => c.date));

      leaderboard.push({
        team,
        completedDays: uniqueDays.size,
      });
    }

    return leaderboard.toSorted((a, b) => b.completedDays - a.completedDays);
  },
});
