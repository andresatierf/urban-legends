import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

export const approve = mutation({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user, "You do not have permission to approve submissions");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    const previousState = group.state;

    // Get tournament for scoring
    const tournament = await ctx.db.get(group.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const scoringConfig = tournament.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    // Calculate points based on group participation
    const pointsEarned = group.isTeamExercise
      ? scoringConfig.teamExercisePoints[group.tier]
      : scoringConfig.individualPoints[group.tier];

    // Update group
    await ctx.db.patch(args.groupId, {
      state: "approved",
      managedBy: user._id,
      pointsEarned,
      updatedAt: new Date().toISOString(),
    });

    // Update all individual submissions in group
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        state: "approved",
        managedBy: user._id,
        pointsEarned, // Each submission gets same points (for consistency)
      });
    }

    // Update team points (only if transitioning to approved)
    if (previousState !== "approved") {
      const team = await ctx.db.get(group.teamId);
      if (team) {
        await ctx.db.patch(group.teamId, {
          points: (team.points || 0) + pointsEarned,
          lastActivityAt: new Date().toISOString(),
        });
      }
    } else if (group.pointsEarned !== pointsEarned) {
      // Re-approval with different points (e.g., participation changed)
      const team = await ctx.db.get(group.teamId);
      if (team) {
        const pointsDiff = pointsEarned - (group.pointsEarned || 0);
        await ctx.db.patch(group.teamId, {
          points: (team.points || 0) + pointsDiff,
          lastActivityAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const reject = mutation({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user, "You do not have permission to reject submissions");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    const previousState = group.state;
    const previousPoints = group.pointsEarned || 0;

    // Update group
    await ctx.db.patch(args.groupId, {
      state: "rejected",
      managedBy: user._id,
      pointsEarned: 0,
      updatedAt: new Date().toISOString(),
    });

    // Update all individual submissions in group
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        state: "rejected",
        managedBy: user._id,
        pointsEarned: 0,
      });
    }

    // Decrement team points if previously approved
    if (previousState === "approved" && previousPoints > 0) {
      const team = await ctx.db.get(group.teamId);
      if (team) {
        await ctx.db.patch(group.teamId, {
          points: Math.max(0, (team.points || 0) - previousPoints),
          lastActivityAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const list = query({
  args: {
    teamId: v.optional(v.id("teams")),
    tournamentId: v.optional(v.id("tournaments")),
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

    let query = ctx.db.query("submissionGroups");

    if (args.teamId) {
      query = query.filter((q) => q.eq(q.field("teamId"), args.teamId));
    }

    if (args.tournamentId) {
      query = query.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
    }

    if (args.state) {
      query = query.filter((q) => q.eq(q.field("state"), args.state));
    }

    if (args.startDate) {
      query = query.filter((q) =>
        q.gte(q.field("date"), args.startDate as string),
      );
    }

    if (args.endDate) {
      query = query.filter((q) =>
        q.lte(q.field("date"), args.endDate as string),
      );
    }

    const groups = await query.collect();

    return groups.toSorted((a, b) => a.date.localeCompare(b.date));
  },
});

export const getWithSubmissions = query({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    // Get all individual submissions
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    // Enrich with user data
    const submissionsWithUsers = await Promise.all(
      submissions.map(async (submission) => {
        const user = await ctx.db.get(submission.userId);
        return {
          ...submission,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
              }
            : null,
        };
      }),
    );

    return {
      ...group,
      submissions: submissionsWithUsers,
    };
  },
});
