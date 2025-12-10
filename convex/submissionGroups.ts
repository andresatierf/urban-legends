import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { nowUTC, toUTCDateString } from "./lib/dates";
import { enrichWithRelations } from "./lib/helpers";
import { hasMinimumRole, validateMinimumRole } from "./roles";
import { recalculateTeamPoints } from "./teams";
import { getCurrentUserOrThrow } from "./users";

/**
 * Calculates group metrics for a set of team submissions.
 * This is the single source of truth for group calculations used by both
 * upsertSubmissionGroup and recalculateSubmissionPoints.
 *
 * @param ctx - Query or Mutation context
 * @param args - Parameters for group calculation
 * @returns Calculated group metrics
 */
export async function calculateGroupMetrics(
  ctx: QueryCtx | MutationCtx,
  args: {
    groupSubmissions: Array<Doc<"submissions">>;
    teamId: Id<"teams">;
    tournamentId: Id<"tournaments">;
  },
): Promise<{
  participantCount: number;
  totalTeamMembers: number;
  participationRate: number;
  isTeamExercise: boolean;
  tier: "base" | "advanced";
  groupState: "pending" | "approved" | "rejected" | "deleted";
  pointsEarned: number;
}> {
  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  const totalTeamMembers = teamMembers.length;
  const participantCount = args.groupSubmissions.length;
  const participationRate =
    totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;

  const tournament = await ctx.db.get(args.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const scoringConfig = tournament.scoringConfig || {
    individualPoints: { base: 1, advanced: 1 },
    teamExercisePoints: { base: 1, advanced: 1 },
    teamExerciseThreshold: 0.5,
  };

  const isTeamExercise =
    participationRate >= scoringConfig.teamExerciseThreshold;

  const hasAdvanced = args.groupSubmissions.some((s) => s.tier === "advanced");
  const tier: "base" | "advanced" = hasAdvanced ? "advanced" : "base";

  const states = new Set(args.groupSubmissions.map((s) => s.state));
  let groupState: "pending" | "approved" | "rejected" | "deleted";

  if (states.size === 1) {
    groupState = Array.from(states)[0] as typeof groupState;
  } else {
    groupState = "pending";
  }

  let pointsEarned = 0;
  if (groupState === "approved") {
    pointsEarned = isTeamExercise
      ? scoringConfig.teamExercisePoints[tier]
      : scoringConfig.individualPoints[tier];
  }

  return {
    participantCount,
    totalTeamMembers,
    participationRate,
    isTeamExercise,
    tier,
    groupState,
    pointsEarned,
  };
}

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

  const metrics = await calculateGroupMetrics(ctx, {
    groupSubmissions: submissions,
    teamId: args.teamId,
    tournamentId: args.tournamentId,
  });

  const now = nowUTC();

  const existingGroup = await ctx.db
    .query("submissionGroups")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date),
    )
    .first();

  const groupData = {
    teamId: args.teamId,
    tournamentId: args.tournamentId,
    date: toUTCDateString(args.date),
    state: metrics.groupState,
    tier: metrics.tier,
    participantCount: metrics.participantCount,
    totalTeamMembers: metrics.totalTeamMembers,
    participationRate: metrics.participationRate,
    isTeamExercise: metrics.isTeamExercise,
    pointsEarned: metrics.pointsEarned,
    updatedAt: now,
  };

  if (existingGroup) {
    await ctx.db.patch(existingGroup._id, groupData);

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        submissionGroupId: existingGroup._id,
        pointsEarned: 0,
      });
    }

    return existingGroup._id;
  }

  const groupId = await ctx.db.insert("submissionGroups", {
    ...groupData,
    createdAt: now,
  });

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

    validateMinimumRole(user, "reviewer", {
      customMessage: "You do not have permission to approve submissions",
    });

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    const tournament = await ctx.db.get(group.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const scoringConfig = tournament.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    const pointsEarned = group.isTeamExercise
      ? scoringConfig.teamExercisePoints[group.tier]
      : scoringConfig.individualPoints[group.tier];

    await ctx.db.patch(args.groupId, {
      state: "approved",
      managedBy: user._id,
      pointsEarned,
      updatedAt: nowUTC(),
    });

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        state: "approved",
        managedBy: user._id,
        pointsEarned: pointsEarned / submissions.length,
      });
    }

    await recalculateTeamPoints(ctx, group.teamId);
  },
});

export const reject = mutation({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateMinimumRole(user, "reviewer", {
      customMessage: "You do not have permission to reject submissions",
    });

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    await ctx.db.patch(args.groupId, {
      state: "rejected",
      managedBy: user._id,
      pointsEarned: 0,
      updatedAt: nowUTC(),
    });

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

    await recalculateTeamPoints(ctx, group.teamId);
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
    validateMinimumRole(user, "admin");

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

    const isAdmin = hasMinimumRole(currentUser, "admin");
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", group.teamId).eq("userId", currentUser._id),
      )
      .first();

    if (!isAdmin && !membership) {
      throw new Error("You do not have permission to view this group");
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    const enrichedSubmissions = await enrichWithRelations(ctx, submissions, {
      user: { table: "users", foreignKey: (s) => s.userId },
    });

    return {
      ...group,
      submissions: enrichedSubmissions,
    };
  },
});

/**
 * Get the count of pending submission groups.
 * Only accessible to admins, reviewers, and tournament managers.
 */
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = hasMinimumRole(user, "reviewer");

    if (!hasAccess) return 0;

    const pending = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pending.length;
  },
});
