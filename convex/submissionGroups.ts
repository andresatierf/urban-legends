import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

/**
 * Internal helper function to create or update a submission group.
 * Only processes TEAM activity submissions - individual submissions are not grouped.
 */
export async function upsertSubmissionGroup(
  ctx: MutationCtx,
  args: {
    teamId: Id<"teams">;
    tournamentId: Id<"tournaments">;
    date: string;
  },
) {
  // Find all TEAM activity submissions for this team on this date
  // (Individual submissions are NOT grouped)
  // Exclude deleted and rejected submissions from the group
  const submissions = await ctx.db
    .query("submissions")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date),
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("submissionType"), "team"),
        q.neq(q.field("state"), "deleted"),
        q.neq(q.field("state"), "rejected"),
      ),
    )
    .collect();

  if (submissions.length === 0) {
    // All submissions deleted - delete group if exists
    const existingGroup = await ctx.db
      .query("submissionGroups")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date),
      )
      .first();

    if (existingGroup) {
      await ctx.db.delete(existingGroup._id);
    }
    return;
  }

  // Get current team member count
  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  const totalTeamMembers = teamMembers.length;
  const participantCount = submissions.length;
  const participationRate =
    totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;

  // Get tournament for threshold
  const tournament = await ctx.db.get(args.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const scoringConfig = tournament.scoringConfig || {
    individualPoints: { base: 1, advanced: 1 },
    teamExercisePoints: { base: 1, advanced: 1 },
    teamExerciseThreshold: 0.5,
  };

  const isTeamExercise =
    participationRate >= scoringConfig.teamExerciseThreshold;

  // Determine tier - use highest tier if mixed
  const hasAdvanced = submissions.some((s) => s.tier === "advanced");
  const tier: "base" | "advanced" = hasAdvanced ? "advanced" : "base";

  // Determine group state - all must be same state
  const states = new Set(submissions.map((s) => s.state));
  let groupState: "pending" | "approved" | "rejected" | "deleted";

  if (states.size === 1) {
    groupState = Array.from(states)[0] as typeof groupState;
  } else {
    // Mixed states - default to pending
    groupState = "pending";
  }

  // Calculate points if approved
  let pointsEarned = 0;
  if (groupState === "approved") {
    pointsEarned = isTeamExercise
      ? scoringConfig.teamExercisePoints[tier]
      : scoringConfig.individualPoints[tier];
  }

  const now = new Date().toISOString();

  // Find existing group
  const existingGroup = await ctx.db
    .query("submissionGroups")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date),
    )
    .first();

  const groupData = {
    teamId: args.teamId,
    tournamentId: args.tournamentId,
    date: args.date,
    state: groupState,
    tier,
    participantCount,
    totalTeamMembers,
    participationRate,
    isTeamExercise,
    pointsEarned,
    updatedAt: now,
  };

  if (existingGroup) {
    // Update existing group
    await ctx.db.patch(existingGroup._id, groupData);

    // Update all submissions with group reference only
    // Points will be recalculated by recalculateSubmissionPoints
    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        submissionGroupId: existingGroup._id,
      });
    }

    return existingGroup._id;
  }
  // Create new group
  const groupId = await ctx.db.insert("submissionGroups", {
    ...groupData,
    createdAt: now,
  });

  // Link all submissions to group
  for (const submission of submissions) {
    await ctx.db.patch(submission._id, {
      submissionGroupId: groupId,
    });
  }

  return groupId;
}

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
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user);

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
    const currentUser = await getCurrentUserOrThrow(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const isAdmin = currentUser.roleNames.includes("admin");
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", group.teamId).eq("userId", currentUser._id),
      )
      .first();

    if (!isAdmin && !membership) {
      throw new Error("You do not have permission to view this group");
    }
    await getCurrentUserOrThrow(ctx);

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
