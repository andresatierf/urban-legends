import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  canApproveSubmission,
  canRejectSubmission,
  hasSomeReviewAccess,
  requireAdmin,
} from "./authority/core";
import { enrichWithRelations } from "./lib/helpers";
import {
  approve as lifecycleApprove,
  reject as lifecycleReject,
} from "./lifecycle/submissions";
import { getCurrentUserOrThrow } from "./users";

export const approve = mutation({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    // Resolve any non-terminal child and let lifecycle.approve fan out to all siblings
    const allGroupSubs = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    const child = allGroupSubs.find(
      (s) => s.state !== "rejected" && s.state !== "deleted",
    );

    if (!child) return;

    // Authority check against the resolved child (includes tournament context)
    await canApproveSubmission.require(ctx, user._id, {
      submissionId: child._id,
    });

    await lifecycleApprove(ctx, child._id, user._id);
  },
});

export const reject = mutation({
  args: {
    groupId: v.id("submissionGroups"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const reason = args.reason.trim();
    if (reason.length === 0) {
      throw new Error("Rejection reason is required");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    // Resolve any non-terminal child and let lifecycle.reject fan out to all siblings
    const allGroupSubs = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    const child = allGroupSubs.find(
      (s) => s.state !== "rejected" && s.state !== "deleted",
    );

    if (!child) return;

    await canRejectSubmission.require(ctx, user._id, {
      submissionId: child._id,
    });

    await lifecycleReject(ctx, child._id, user._id, {
      rejectionReason: reason,
    });
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
    await requireAdmin(ctx, user._id);

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

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", group.teamId).eq("userId", currentUser._id),
      )
      .first();

    const isSomeReviewer = await hasSomeReviewAccess(ctx, currentUser._id);

    if (!isSomeReviewer && !membership) {
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

    const hasAccess = await hasSomeReviewAccess(ctx, user._id);

    if (!hasAccess) return 0;

    const pending = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pending.length;
  },
});
