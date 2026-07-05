import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  canApproveActivity,
  canCreateActivity,
  canDeleteActivity,
  canEditActivity,
  canRejectActivity,
  computeActivityPermissions,
  hasSomeReviewAccess,
  hasSomeTournamentManagerAccess,
} from "./authority/core";
import {
  approve as lifecycleApprove,
  create as lifecycleCreate,
  edit as lifecycleEdit,
  recompute as lifecycleRecompute,
  reject as lifecycleReject,
  softDelete as lifecycleSoftDelete,
} from "./lifecycle/activities";
import {
  notifyActivityApproved,
  notifyActivityRejected,
} from "./notifications/triggers";
import { getCurrentUserOrThrow, getUser } from "./users";

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
    evidenceStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canCreateActivity.require(ctx, user._id, { teamId: args.teamId });

    return await lifecycleCreate(ctx, {
      userId: user._id,
      teamId: args.teamId,
      date: args.date,
      tier: args.tier,
      description: args.description,
      evidenceStorageIds: args.evidenceStorageIds,
    });
  },
});

export const edit = mutation({
  args: {
    activityId: v.id("activities"),
    date: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
    evidenceStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canEditActivity.require(ctx, user._id, {
      activityId: args.activityId,
    });

    await lifecycleEdit(
      ctx,
      args.activityId,
      {
        date: args.date,
        description: args.description,
        tier: args.tier,
        evidenceStorageIds: args.evidenceStorageIds,
      },
      user._id,
    );
  },
});

export const approve = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canApproveActivity.require(ctx, user._id, {
      activityId: args.activityId,
    });

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const result = await lifecycleApprove(ctx, args.activityId, user._id);

    if (result.state === "approved") {
      const team = await ctx.db.get(activity.teamId);
      if (team) {
        const teamMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", activity.teamId))
          .collect();
        const updated = await ctx.db.get(args.activityId);
        await notifyActivityApproved(ctx, {
          recipientIds: teamMembers.map((m) => m.userId),
          activityId: args.activityId,
          teamName: team.name,
          description: activity.description,
          pointsEarned: updated?.pointsEarned ?? 0,
        });
      }
    }
  },
});

export const reject = mutation({
  args: {
    activityId: v.id("activities"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const reason = args.reason.trim();
    if (reason.length === 0) {
      throw new Error("Rejection reason is required");
    }

    await canRejectActivity.require(ctx, user._id, {
      activityId: args.activityId,
    });

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const wasRejected = activity.state === "rejected";
    await lifecycleReject(ctx, args.activityId, user._id, {
      rejectionReason: reason,
    });

    if (!wasRejected) {
      const team = await ctx.db.get(activity.teamId);
      if (team) {
        const teamMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", activity.teamId))
          .collect();
        await notifyActivityRejected(ctx, {
          recipientIds: teamMembers.map((m) => m.userId),
          activityId: args.activityId,
          teamName: team.name,
          description: activity.description,
          reason,
        });
      }
    }
  },
});

export const remove = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canDeleteActivity.require(ctx, user._id, {
      activityId: args.activityId,
    });

    await lifecycleSoftDelete(ctx, args.activityId, user._id);
  },
});

export const recalculatePoints = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canApproveActivity.require(ctx, user._id, {
      activityId: args.activityId,
    });

    const result = await lifecycleRecompute(
      ctx,
      { kind: "activity", id: args.activityId },
      user._id,
    );

    return {
      success: true,
      activitiesTouched: result.activitiesTouched,
      message: `Points recalculated. ${result.activitiesTouched} activity(ies) updated.`,
    };
  },
});

// ── ActivityView: enriched read for the detail screen ────────────────────────
export const getDetails = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const permissions = await computeActivityPermissions(
      ctx,
      user._id,
      args.activityId,
    );
    if (!permissions.canView) {
      throw new Error("You do not have permission to view this Activity");
    }

    const [team, tournament, creator, participations] = await Promise.all([
      ctx.db.get(activity.teamId),
      ctx.db.get(activity.tournamentId),
      getUser(ctx, { userId: activity.createdBy, throw: false }),
      ctx.db
        .query("participations")
        .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
        .collect(),
    ]);

    if (!team) throw new Error("Team not found");
    if (!tournament) throw new Error("Tournament not found");

    const creatorParticipation = participations.find(
      (p) => p.userId === activity.createdBy,
    );

    const evidenceStorageIds = creatorParticipation?.evidenceStorageIds ?? [];
    const evidenceResolved = await Promise.all(
      evidenceStorageIds.map(async (storageId, idx) => {
        const url = await ctx.storage.getUrl(storageId);
        if (!url) return null;
        return {
          _id: storageId,
          url,
          filename: `evidence-${idx + 1}.jpg`,
        };
      }),
    );
    const evidence = evidenceResolved.filter(
      (e): e is NonNullable<typeof e> => e !== null,
    );

    const managedByUser = activity.managedBy
      ? await getUser(ctx, { userId: activity.managedBy, throw: false })
      : null;

    return {
      activity,
      team,
      tournament,
      creator,
      participations,
      managedByUser,
      evidence,
      canEdit: permissions.canEdit,
      canApprove: permissions.canApprove,
      canReject: permissions.canReject,
      canDelete: permissions.canDelete,
    };
  },
});

// ── Reviewer queue: pending Activities in tournaments the viewer can review ──
export const reviewerQueue = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Restrict to tournaments the viewer has any review-adjacent role in
    // (dev/admin see all; reviewers/managers see their assigned tournaments).
    const canReviewAll = await hasSomeReviewAccess(ctx, user._id);
    if (!canReviewAll) return [];

    let pendingActivities;
    if (args.tournamentId) {
      pendingActivities = await ctx.db
        .query("activities")
        .withIndex("by_tournament_and_state", (q) =>
          q
            .eq("tournamentId", args.tournamentId as Id<"tournaments">)
            .eq("state", "pending"),
        )
        .collect();
    } else {
      pendingActivities = await ctx.db
        .query("activities")
        .withIndex("by_state", (q) => q.eq("state", "pending"))
        .collect();
    }

    // Filter to tournaments the viewer has an explicit role in (or is dev/admin).
    const tournamentRoles = await ctx.db
      .query("tournamentRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const allowedTournamentIds = new Set(
      tournamentRoles.map((r) => r.tournamentId as string),
    );

    // Load dev/admin roles: if user has global admin/dev, allow all.
    const userRoleRows = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const systemRoles = (
      await Promise.all(userRoleRows.map((ur) => ctx.db.get(ur.roleId)))
    )
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map((r) => r.name);
    const isGlobal =
      systemRoles.includes("dev") || systemRoles.includes("admin");

    const filtered = isGlobal
      ? pendingActivities
      : pendingActivities.filter((a) =>
          allowedTournamentIds.has(a.tournamentId as string),
        );

    // Attach team name + creator name + first-evidence thumbnail for the queue card.
    const enriched = await Promise.all(
      filtered.map(async (a) => {
        const [team, creator, parts] = await Promise.all([
          ctx.db.get(a.teamId),
          getUser(ctx, { userId: a.createdBy, throw: false }),
          ctx.db
            .query("participations")
            .withIndex("by_activity", (q) => q.eq("activityId", a._id))
            .collect(),
        ]);
        const creatorPart = parts.find((p) => p.userId === a.createdBy);
        const firstEvidenceId = creatorPart?.evidenceStorageIds?.[0];
        const thumbnailUrl = firstEvidenceId
          ? await ctx.storage.getUrl(firstEvidenceId)
          : null;
        return {
          ...a,
          teamName: team?.name ?? "",
          creatorName: creator?.name ?? creator?.email ?? "",
          thumbnailUrl,
          evidenceCount: creatorPart?.evidenceStorageIds?.length ?? 0,
        };
      }),
    );

    return enriched.toSorted((a, b) => a._creationTime - b._creationTime);
  },
});

// ── Authority: routing/entry-point permissions for /activities pages ─────────
export const getAuthority = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const [canReview, canManage, teamMembership] = await Promise.all([
      hasSomeReviewAccess(ctx, user._id),
      hasSomeTournamentManagerAccess(ctx, user._id),
      ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first(),
    ]);

    const isPlayer = teamMembership !== null;

    let pendingReviewCount = 0;
    if (canReview) {
      const pending = await ctx.db
        .query("activities")
        .withIndex("by_state", (q) => q.eq("state", "pending"))
        .collect();
      pendingReviewCount = pending.length;
    }

    return { canReview, canManage, isPlayer, pendingReviewCount };
  },
});

// Lightweight list of the current user's Activities (for personal listing).
export const listMine = query({
  args: {
    state: v.optional(
      v.union(
        v.literal("incomplete"),
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("deleted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const parts = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const activityIds = Array.from(new Set(parts.map((p) => p.activityId)));

    const activities = await Promise.all(
      activityIds.map((id) => ctx.db.get(id)),
    );
    const nonNull = activities.filter(
      (a): a is NonNullable<typeof a> => a !== null,
    );

    return args.state
      ? nonNull.filter((a) => a.state === args.state)
      : nonNull.filter((a) => a.state !== "deleted");
  },
});
