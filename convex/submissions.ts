import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const markCompletion = mutation({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
    completed: v.boolean(),
    teammates: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Get team to find tournament
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if completion already exists
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date),
      )
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        teammates: args.teammates,
      });
    } else {
      await ctx.db.insert("submissions", {
        userId,
        teamId: args.teamId,
        tournamentId: team.tournamentId,
        date: args.date,
        completed: args.completed,
        teammates: args.teammates,
      });
    }
  },
});

export const getUserCompletions = query({
  args: {
    teamId: v.id("teams"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("submissions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("teamId"), args.teamId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
        ),
      )
      .collect();
  },
});

export const getTeamCompletions = query({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const completions = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date),
      )
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    const completionsWithUsers = [];
    for (const completion of completions) {
      const user = await ctx.db.get(completion.userId);
      if (user) {
        const teammatesWithUsers = [];
        for (const teammateId of completion.teammates) {
          const teammate = await ctx.db.get(teammateId);
          if (teammate) {
            teammatesWithUsers.push(teammate);
          }
        }

        completionsWithUsers.push({
          ...completion,
          user,
          teammatesWithUsers,
        });
      }
    }

    return completionsWithUsers;
  },
});
