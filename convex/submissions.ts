import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    state: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("deleted"),
      ),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    let query = ctx.db.query("submissions");

    if (args.userId)
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));

    if (args.teamId)
      query = query.filter((q) => q.eq(q.field("teamId"), args.teamId));

    if (args.state)
      query = query.filter((q) => q.eq(q.field("state"), args.state));

    if (args.startDate)
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));

    if (args.endDate)
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));

    const submissions = await query.collect();

    return submissions.toSorted((a, b) => {
      if (a.date === b.date) return 0;
      return a.date.localeCompare(b.date);
    });
  },
});

export const listUserSubmissions = query({
  args: {
    state: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("deleted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.state) {
      return await ctx.db
        .query("submissions")
        .withIndex("by_user_and_state", (q) =>
          q.eq("userId", userId).eq("state", args.state!),
        )
        .collect();
    }

    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.get(args.id);
  },
});

export const createSubmission = mutation({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
    description: v.optional(v.string()),
    teammateIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    await ctx.db.insert("submissions", {
      userId,
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      date: args.date,
      description: args.description,
      teammates: args.teammateIds,
      state: "pending",
    });
  },
});

export const editSubmission = mutation({
  args: {
    id: v.id("submissions"),
    date: v.string(),
    teamId: v.id("teams"),
    description: v.optional(v.string()),
    teammateIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.userId !== userId) {
      throw new Error("You do not have permission to edit this submission");
    }

    const { date, teamId, description, teammateIds } = args;

    await ctx.db.patch(args.id, {
      date,
      teamId,
      description,
      teammates: teammateIds,
    });
  },
});

export const getUserSubmissions = query({
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
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

export const getTeamSubmissions = query({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date),
      )
      .filter((q) => q.eq(q.field("state"), "approved"))
      .collect();

    const submissionsWithUsers = [];
    for (const submission of submissions) {
      const user = await ctx.db.get(submission.userId);
      if (user) {
        const teammatesWithUsers = [];
        for (const teammateId of submission.teammates) {
          const teammate = await ctx.db.get(teammateId);
          if (teammate) {
            teammatesWithUsers.push(teammate);
          }
        }

        submissionsWithUsers.push({
          ...submission,
          user,
          teammatesWithUsers,
        });
      }
    }

    return submissionsWithUsers;
  },
});

export const approve = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!user.roles.includes("admin")) {
      throw new Error("You do not have permission to approve this submission");
    }

    await ctx.db.patch(args.submissionId, { state: "approved" });
  },
});

export const reject = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!user.roles.includes("admin")) {
      throw new Error("You do not have permission to reject this submission");
    }

    await ctx.db.patch(args.submissionId, { state: "rejected" });
  },
});
