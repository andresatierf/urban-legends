import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  canApproveSubmission,
  canDeleteSubmission,
  canRejectSubmission,
  canViewSubmission,
  computeSubmissionPermissions,
  hasSomeReviewAccess,
  hasSomeTournamentManagerAccess,
} from "./authority/core";
import {
  extractDateFromISO,
  toUTCDateString,
  toUTCEndOfDayString,
} from "./lib/dates";
import {
  approve as lifecycleApprove,
  edit as lifecycleEdit,
  recompute as lifecycleRecompute,
  reject as lifecycleReject,
  softDelete as lifecycleSoftDelete,
  submit as lifecycleSubmit,
  previewIsTeamExercise,
} from "./lifecycle/submissions";
import {
  notifySubmissionApproved,
  notifySubmissionRejected,
  notifyTeammateSubmitted,
} from "./notifications/triggers";
import { type UserWithRoles, getCurrentUserOrThrow, getUser } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    tournamentId: v.optional(v.id("tournaments")),
    state: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("deleted"),
        v.array(
          v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("deleted"),
          ),
        ),
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

    if (args.teamId && args.tournamentId)
      throw new Error("teamId and tournamentId cannot be used together");

    if (args.teamId)
      query = query.filter((q) => q.eq(q.field("teamId"), args.teamId));

    if (args.tournamentId) {
      const teams = await ctx.db
        .query("teams")
        .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
        .collect();

      query = query.filter((q) =>
        q.or(...teams.map((t) => q.eq(q.field("teamId"), t._id))),
      );
    }

    if (args.state) {
      if (Array.isArray(args.state)) {
        query = query.filter((q) =>
          q.or(
            ...(args.state as typeof args.state).map((s) =>
              q.eq(q.field("state"), s),
            ),
          ),
        );
      } else {
        query = query.filter((q) => q.eq(q.field("state"), args.state));
      }
    }

    if (args.startDate)
      query = query.filter((q) =>
        q.gte(q.field("date"), args.startDate as string),
      );

    if (args.endDate)
      query = query.filter((q) =>
        q.lte(q.field("date"), args.endDate as string),
      );

    const submissions = await query.collect();

    const withThumbnails = await Promise.all(
      submissions.map(async (sub) => {
        const storageIds = sub.evidenceStorageIds ?? [];
        const thumbnailUrl = storageIds[0]
          ? await ctx.storage.getUrl(storageIds[0])
          : null;
        return { ...sub, thumbnailUrl, evidenceCount: storageIds.length };
      }),
    );

    return withThumbnails.toSorted((a, b) => {
      if (a.date === b.date) return 0;
      return a.date.localeCompare(b.date);
    });
  },
});

export const get = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    await canViewSubmission.require(ctx, user._id, {
      submissionId: args.submissionId,
    });

    return submission;
  },
});

export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    date: v.string(),
    teamId: v.id("teams"),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
    submissionType: v.union(v.literal("individual"), v.literal("team")),
    evidenceStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // CREATE branch requires at least one Evidence image; edit branch length
    // validation happens inside lifecycle.edit when evidenceStorageIds is provided.
    if (!args._id) {
      const evidenceIds = args.evidenceStorageIds ?? [];
      if (evidenceIds.length === 0) {
        throw new Error("A Submission requires at least 1 Evidence image");
      }
      if (evidenceIds.length > 5) {
        throw new Error("A Submission allows a maximum 5 Evidence images");
      }
    }

    const [membership, team] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", args.teamId).eq("userId", user._id),
        )
        .first(),
      ctx.db.get(args.teamId),
    ]);

    if (!membership) throw new Error("You are not a member of this team");
    if (!team) throw new Error("Team not found");

    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    let submissionId: Id<"submissions">;

    if (args._id) {
      // EDIT BRANCH — routed through lifecycle.edit (#38)
      const submission = await ctx.db.get(args._id);

      if (!submission) throw new Error("Submission not found");
      if (submission.createdBy !== user._id) {
        throw new Error("You do not have permission to update this submission");
      }

      await lifecycleEdit(
        ctx,
        args._id,
        {
          date: args.date,
          type: args.submissionType,
          tier: args.tier,
          description: args.description,
          evidenceStorageIds: args.evidenceStorageIds,
        },
        user._id,
      );
      submissionId = args._id;
    } else {
      // CREATE BRANCH — routed through lifecycle.submit (#34)
      submissionId = await lifecycleSubmit(ctx, {
        userId: user._id,
        teamId: args.teamId,
        date: args.date,
        type: args.submissionType,
        tier: args.tier,
        description: args.description,
        evidenceStorageIds: args.evidenceStorageIds,
      });
    }

    // T027: Notify teammates when someone submits (only for new submissions)
    if (!args._id) {
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      const teammateIds = teamMembers
        .map((m) => m.userId)
        .filter((id) => id !== user._id);

      if (teammateIds.length > 0) {
        await notifyTeammateSubmitted(ctx, {
          recipientIds: teammateIds,
          submissionId,
          teamId: args.teamId,
          submitterName: user.name || user.email,
          description: args.description,
        });
      }
    }

    return submissionId;
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
    const user = await getCurrentUserOrThrow(ctx);

    if (args.state) {
      return await ctx.db
        .query("submissions")
        .withIndex("by_user_and_state", (q) =>
          q.eq("userId", user._id).eq("state", args.state as typeof args.state),
        )
        .collect();
    }

    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getDetails = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const permissions = await computeSubmissionPermissions(
      ctx,
      currentUser._id,
      args.submissionId,
    );

    if (!permissions.canView) {
      throw new Error("You do not have permission to view this submission");
    }

    const [team, tournament, submitter] = await Promise.all([
      ctx.db.get(submission.teamId),
      ctx.db.get(submission.tournamentId),
      getUser(ctx, { userId: submission.userId }),
    ]);

    let teammates: UserWithRoles[] = [];

    if (submission.submissionType === "team" && submission.submissionGroupId) {
      const groupSubmissions = await ctx.db
        .query("submissions")
        .withIndex("by_group", (q) =>
          q.eq("submissionGroupId", submission.submissionGroupId),
        )
        .filter((q) =>
          q.and(
            q.neq(q.field("state"), "deleted"),
            q.neq(q.field("state"), "rejected"),
            q.neq(q.field("userId"), submission.userId),
          ),
        )
        .collect();

      const teammatePromises = groupSubmissions.map(({ userId }) =>
        getUser(ctx, { userId, throw: false }),
      );

      const fetchedTeammates = await Promise.all(teammatePromises);
      teammates = fetchedTeammates.filter(
        (t): t is NonNullable<typeof t> => t !== null,
      );
    }

    let managedByUser: UserWithRoles | null = null;

    if (submission.managedBy) {
      managedByUser = await getUser(ctx, {
        userId: submission.managedBy,
        throw: false,
      });
    }

    if (!team) throw new Error("Team not found");
    if (!tournament) throw new Error("Tournament not found");

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();
    const totalTeamMembers = teamMembers.length;

    let participantCount = 1;
    if (submission.submissionType === "team" && submission.submissionGroupId) {
      const groupSubs = await ctx.db
        .query("submissions")
        .withIndex("by_group", (q) =>
          q.eq("submissionGroupId", submission.submissionGroupId),
        )
        .collect();
      participantCount = groupSubs.filter(
        (s) => s.state !== "deleted" && s.state !== "rejected",
      ).length;
    }

    const isTeamExercise = previewIsTeamExercise({
      participantCount,
      totalTeamMembers,
      threshold: tournament.scoringConfig.teamExerciseThreshold,
    });

    const evidenceResolved = await Promise.all(
      (submission.evidenceStorageIds ?? []).map(async (storageId, idx) => {
        const url = await ctx.storage.getUrl(storageId);
        if (!url) return null;
        return {
          _id: storageId as string,
          url,
          filename: `evidence-${idx + 1}.jpg`,
        };
      }),
    );
    const evidence = evidenceResolved.filter(
      (e): e is NonNullable<typeof e> => e !== null,
    );

    return {
      submission,
      team,
      tournament,
      submitter,
      teammates,
      managedByUser,
      isTeamExercise,
      evidence,
      canEdit: permissions.canEdit,
      canApprove: permissions.canApprove,
      canReject: permissions.canReject,
      canDelete: permissions.canDelete,
    };
  },
});

export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canDeleteSubmission.require(ctx, user._id, {
      submissionId: args.submissionId,
    });

    await lifecycleSoftDelete(ctx, args.submissionId, user._id);
  },
});

export const approve = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canApproveSubmission.require(ctx, user._id, {
      submissionId: args.submissionId,
    });

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const result = await lifecycleApprove(ctx, args.submissionId, user._id);

    // T025: Notify team members about submission approval
    if (result.affected.length > 0) {
      const team = await ctx.db.get(submission.teamId);
      if (team) {
        const teamMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
          .collect();

        const memberIds = teamMembers.map((m) => m.userId);
        const updatedSubmission = await ctx.db.get(args.submissionId);
        if (updatedSubmission) {
          await notifySubmissionApproved(ctx, {
            recipientIds: memberIds,
            submissionId: args.submissionId,
            teamName: team.name,
            description: submission.description,
            pointsEarned: updatedSubmission.pointsEarned || 0,
          });
        }
      }
    }
  },
});

export const reject = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canRejectSubmission.require(ctx, user._id, {
      submissionId: args.submissionId,
    });

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const wasAlreadyRejected = submission.state === "rejected";
    await lifecycleReject(ctx, args.submissionId, user._id);

    // T026: Notify team members about submission rejection (only when state changed)
    if (!wasAlreadyRejected) {
      const team = await ctx.db.get(submission.teamId);
      if (team) {
        const teamMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
          .collect();

        const memberIds = teamMembers.map((m) => m.userId);

        await notifySubmissionRejected(ctx, {
          recipientIds: memberIds,
          submissionId: args.submissionId,
          teamName: team.name,
          description: submission.description,
          reason: undefined,
        });
      }
    }
  },
});

export const getMonthSubmissions = query({
  args: {
    teamId: v.id("teams"),
    userId: v.optional(v.id("users")),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const startDateStr = `${args.year}-${String(args.month).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(args.year, args.month, 0).getDate();
    const endDateStr = `${args.year}-${String(args.month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

    const startDate = toUTCDateString(startDateStr);
    const endDate = toUTCEndOfDayString(endDateStr);

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_user", (q) => {
        const filter = q.eq("teamId", args.teamId);

        if (args.userId) {
          return filter.eq("userId", args.userId);
        }

        return filter;
      })
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate),
          q.neq(q.field("state"), "deleted"),
        ),
      )
      .collect();

    const result: Record<
      string,
      {
        _id: Id<"submissions">;
        state: "pending" | "approved" | "rejected" | "deleted";
        description: string | undefined;
        pointsEarned: number;
        userId: Id<"users">;
        thumbnailUrl: string | null;
        evidenceCount: number;
      }
    > = {};

    await Promise.all(
      submissions.map(async (sub) => {
        const dateKey = extractDateFromISO(sub.date);
        const storageIds = sub.evidenceStorageIds ?? [];
        const thumbnailUrl = storageIds[0]
          ? await ctx.storage.getUrl(storageIds[0])
          : null;
        result[dateKey] = {
          _id: sub._id,
          state: sub.state,
          description: sub.description,
          pointsEarned: sub.pointsEarned || 0,
          userId: sub.userId,
          thumbnailUrl,
          evidenceCount: storageIds.length,
        };
      }),
    );

    return result;
  },
});

export const getUserStatistics = query({
  args: {
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .collect();

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (today < startDate) {
      return {
        totalDays: 0,
        daysWithSubmissions: 0,
        completionRate: 0,
        currentStreak: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    }

    const relevantEndDate = today < endDate ? today : endDate;
    const formatDateKey = (date: Date) =>
      [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-");
    const startDateKey = formatDateKey(startDate);
    const relevantEndDateKey = formatDateKey(relevantEndDate);
    const relevantSubmissions = submissions.filter((s) => {
      if (s.state === "deleted") return false;
      if (s.date < startDateKey) return false;
      if (s.date > relevantEndDateKey) return false;
      return true;
    });

    const totalDays =
      Math.floor(
        (relevantEndDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const daysWithSubmissions = new Set(relevantSubmissions.map((s) => s.date))
      .size;
    const completionRate =
      totalDays > 0 ? (daysWithSubmissions / totalDays) * 100 : 0;

    let currentStreak = 0;
    const sortedDates = Array.from(
      new Set(
        relevantSubmissions
          .filter((s) => s.state === "approved")
          .map((s) => s.date),
      ),
    ).sort();

    const toDateKey = (date: Date) =>
      [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-");

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      const dateStr = toDateKey(date);

      if (date < startDate) break;

      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        if (i > 0) break;
      }
    }

    const stateCounts = {
      approved: relevantSubmissions.filter((s) => s.state === "approved")
        .length,
      pending: relevantSubmissions.filter((s) => s.state === "pending").length,
      rejected: relevantSubmissions.filter((s) => s.state === "rejected")
        .length,
    };

    return {
      totalDays,
      daysWithSubmissions,
      completionRate: Math.round(completionRate),
      currentStreak,
      ...stateCounts,
    };
  },
});

export const getTeamStatistics = query({
  args: {
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (today < startDate) {
      return {
        totalDays: 0,
        daysWithSubmissions: 0,
        completionRate: 0,
        currentStreak: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    }

    const relevantEndDate = today < endDate ? today : endDate;
    const formatDateKey = (date: Date) =>
      [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-");
    const startDateKey = formatDateKey(startDate);
    const relevantEndDateKey = formatDateKey(relevantEndDate);
    const relevantSubmissions = submissions.filter((s) => {
      if (s.state === "deleted") return false;
      if (s.date < startDateKey) return false;
      if (s.date > relevantEndDateKey) return false;
      return true;
    });

    const totalDays =
      Math.floor(
        (relevantEndDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const daysWithSubmissions = new Set(relevantSubmissions.map((s) => s.date))
      .size;
    const completionRate =
      totalDays > 0 ? (daysWithSubmissions / totalDays) * 100 : 0;

    let currentStreak = 0;
    const sortedDates = Array.from(
      new Set(relevantSubmissions.map((s) => s.date)),
    ).sort();

    const toDateKey = (date: Date) =>
      [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-");

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      const dateStr = toDateKey(date);

      if (date < startDate) break;

      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        if (i > 0) break;
      }
    }

    const stateCounts = {
      approved: relevantSubmissions.filter((s) => s.state === "approved")
        .length,
      pending: relevantSubmissions.filter((s) => s.state === "pending").length,
      rejected: relevantSubmissions.filter((s) => s.state === "rejected")
        .length,
    };

    return {
      totalDays,
      daysWithSubmissions,
      completionRate: Math.round(completionRate),
      currentStreak,
      ...stateCounts,
    };
  },
});

export const recalculatePoints = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canApproveSubmission.require(ctx, user._id, {
      submissionId: args.submissionId,
    });

    const result = await lifecycleRecompute(
      ctx,
      { kind: "submission", id: args.submissionId },
      user._id,
    );

    return {
      success: true,
      submissionsTouched: result.submissionsTouched,
      message: `Points recalculated. ${result.submissionsTouched} submission(s) updated.`,
    };
  },
});

// ── getAuthority ──────────────────────────────────────────────────────────────

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
      const [pendingIndividual, pendingGroups] = await Promise.all([
        ctx.db
          .query("submissions")
          .withIndex("by_state", (q) => q.eq("state", "pending"))
          .filter((q) => q.eq(q.field("submissionType"), "individual"))
          .collect(),
        ctx.db
          .query("submissionGroups")
          .withIndex("by_state", (q) => q.eq("state", "pending"))
          .collect(),
      ]);
      pendingReviewCount = pendingIndividual.length + pendingGroups.length;
    }

    return { canReview, canManage, isPlayer, pendingReviewCount };
  },
});
