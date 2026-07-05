import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  canApproveActivity,
  canCreateActivity,
  canDeleteActivity,
  canEditActivity,
  canRejectActivity,
  canRemoveParticipant,
  canSubmitEvidence,
  computeActivityPermissions,
  hasSomeReviewAccess,
  hasSomeTournamentManagerAccess,
} from "./authority/core";
import {
  approve as lifecycleApprove,
  create as lifecycleCreate,
  createGroup as lifecycleCreateGroup,
  edit as lifecycleEdit,
  recompute as lifecycleRecompute,
  reject as lifecycleReject,
  removeParticipant as lifecycleRemoveParticipant,
  softDelete as lifecycleSoftDelete,
  submitEvidence as lifecycleSubmitEvidence,
} from "./lifecycle/activities";
import {
  notifyActivityApproved,
  notifyActivityParticipationRequested,
  notifyActivityRejected,
} from "./notifications/triggers";
import { getCurrentUserOrThrow, getUser } from "./users";

async function getTeamNotificationData(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<{ teamName: string; recipientIds: Id<"users">[] } | null> {
  const team = await ctx.db.get(teamId);
  if (!team) return null;
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
  return { teamName: team.name, recipientIds: members.map((m) => m.userId) };
}

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
    type: v.optional(v.union(v.literal("individual"), v.literal("group"))),
    participantUserIds: v.optional(v.array(v.id("users"))),
    evidenceStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canCreateActivity.require(ctx, user._id, { teamId: args.teamId });

    if (args.type === "group") {
      const activityId = await lifecycleCreateGroup(ctx, {
        userId: user._id,
        teamId: args.teamId,
        date: args.date,
        tier: args.tier,
        description: args.description,
        participantUserIds: args.participantUserIds ?? [],
        evidenceStorageIds: args.evidenceStorageIds,
      });

      const [team, parts] = await Promise.all([
        ctx.db.get(args.teamId),
        ctx.db
          .query("participations")
          .withIndex("by_activity", (q) => q.eq("activityId", activityId))
          .collect(),
      ]);
      const recipientIds = parts
        .filter((p) => p.userId !== user._id)
        .map((p) => p.userId);
      if (recipientIds.length > 0 && team) {
        await notifyActivityParticipationRequested(ctx, {
          recipientIds,
          activityId,
          teamName: team.name,
          creatorName: user.name ?? user.email ?? "A teammate",
          description: args.description,
        });
      }

      return activityId;
    }

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

export const submitEvidence = mutation({
  args: {
    activityId: v.id("activities"),
    evidenceStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canSubmitEvidence.require(ctx, user._id, {
      activityId: args.activityId,
    });

    return await lifecycleSubmitEvidence(ctx, {
      activityId: args.activityId,
      userId: user._id,
      evidenceStorageIds: args.evidenceStorageIds,
    });
  },
});

export const removeParticipant = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canRemoveParticipant.require(ctx, user._id, {
      activityId: args.activityId,
    });

    return await lifecycleRemoveParticipant(ctx, {
      activityId: args.activityId,
      userId: args.userId,
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
      const notif = await getTeamNotificationData(ctx, activity.teamId);
      if (notif) {
        const updated = await ctx.db.get(args.activityId);
        await notifyActivityApproved(ctx, {
          recipientIds: notif.recipientIds,
          activityId: args.activityId,
          teamName: notif.teamName,
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
      const notif = await getTeamNotificationData(ctx, activity.teamId);
      if (notif) {
        await notifyActivityRejected(ctx, {
          recipientIds: notif.recipientIds,
          activityId: args.activityId,
          teamName: notif.teamName,
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

    const roster = await Promise.all(
      participations.map(async (p) => {
        const [participant, evidenceResolved] = await Promise.all([
          getUser(ctx, { userId: p.userId, throw: false }),
          Promise.all(
            (p.evidenceStorageIds ?? []).map(async (storageId, idx) => {
              const url = await ctx.storage.getUrl(storageId);
              if (!url) return null;
              return {
                _id: storageId,
                url,
                filename: `evidence-${idx + 1}.jpg`,
              };
            }),
          ),
        ]);
        return {
          participation: p,
          user: participant,
          evidence: evidenceResolved.filter(
            (e): e is NonNullable<typeof e> => e !== null,
          ),
          fulfilled: !!p.fulfilledAt,
        };
      }),
    );

    const creatorRoster = roster.find(
      (r) => r.participation.userId === activity.createdBy,
    );
    const evidence = creatorRoster?.evidence ?? [];

    const viewerParticipation = participations.find(
      (p) => p.userId === user._id,
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
      roster,
      viewerParticipation,
      managedByUser,
      evidence,
      canEdit: permissions.canEdit,
      canApprove: permissions.canApprove,
      canReject: permissions.canReject,
      canDelete: permissions.canDelete,
      canSubmitEvidence: permissions.canSubmitEvidence,
      canRemoveParticipant: permissions.canRemoveParticipant,
    };
  },
});

// ── Reviewer queue: pending Activities in tournaments the viewer can review ──
// includeIncomplete surfaces `incomplete` Activities alongside pending ones
// (view-only — approval remains blocked by the lifecycle for incomplete).
export const reviewerQueue = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
    includeIncomplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Restrict to tournaments the viewer has any review-adjacent role in
    // (dev/admin see all; reviewers/managers see their assigned tournaments).
    const canReviewAll = await hasSomeReviewAccess(ctx, user._id);
    if (!canReviewAll) return [];

    const states = args.includeIncomplete
      ? (["pending", "incomplete"] as const)
      : (["pending"] as const);

    const perState = await Promise.all(
      states.map((state) =>
        args.tournamentId
          ? ctx.db
              .query("activities")
              .withIndex("by_tournament_and_state", (q) =>
                q
                  .eq("tournamentId", args.tournamentId as Id<"tournaments">)
                  .eq("state", state),
              )
              .collect()
          : ctx.db
              .query("activities")
              .withIndex("by_state", (q) => q.eq("state", state))
              .collect(),
      ),
    );
    const pendingActivities = perState.flat();

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
