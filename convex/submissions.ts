import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  extractDateFromISO,
  nowUTC,
  toUTCDateString,
  toUTCEndOfDayString,
} from "./lib/dates";
import {
  approve as lifecycleApprove,
  submit as lifecycleSubmit,
} from "./lifecycle/submissions";
import {
  notifySubmissionApproved,
  notifySubmissionRejected,
  notifyTeammateSubmitted,
} from "./notifications/triggers";
import { hasMinimumRole, validateMinimumRole } from "./roles";
import {
  calculateGroupMetrics,
  upsertSubmissionGroup,
} from "./submissionGroups";
import { recalculateTeamPoints } from "./teams";
import { getCurrentUserOrThrow, getUser, type UserWithRoles } from "./users";

/**
 * Gets the count of active participants in a submission group.
 * For team submissions, this counts all submissions in the group that are not deleted or rejected.
 * For individual submissions, this returns 1 (just the submitter).
 *
 * @param ctx - Query or Mutation context
 * @param submission - The submission to count participants for
 * @returns The number of active participants
 */
async function getParticipantCount(
  ctx: QueryCtx | MutationCtx,
  submission: Doc<"submissions">,
): Promise<number> {
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
        ),
      )
      .collect();

    return groupSubmissions.length;
  }

  return 1;
}

/**
 * Recalculates points for a submission and its group (if applicable).
 * This function should be called whenever a submission's state changes
 * (approved, rejected, deleted) to ensure points are correctly calculated
 * and updated for both the submission and its team.
 *
 * @param ctx - Mutation context
 * @param args - Submission ID and optional previous state
 * @returns The updated points difference (positive = points added, negative = points removed)
 */
export async function recalculateSubmissionPoints(
  ctx: MutationCtx,
  args: {
    submissionId: Id<"submissions">;
    previousState?: "pending" | "approved" | "rejected" | "deleted";
    managedBy?: Id<"users">;
    skipTeamRecalculation?: boolean;
  },
): Promise<number> {
  const submission = await ctx.db.get(args.submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  const oldPoints = submission.pointsEarned || 0;

  const [tournament, team] = await Promise.all([
    ctx.db.get(submission.tournamentId),
    ctx.db.get(submission.teamId),
  ]);

  if (!tournament) throw new Error("Tournament not found");
  if (!team) throw new Error("Team not found");

  const scoringConfig = tournament.scoringConfig || {
    individualPoints: { base: 1, advanced: 1 },
    teamExercisePoints: { base: 1, advanced: 1 },
    teamExerciseThreshold: 0.5,
  };

  const tier = submission.tier || "base";

  if (submission.submissionType === "team" && submission.submissionGroupId) {
    const group = await ctx.db.get(submission.submissionGroupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const groupSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) =>
        q.eq("submissionGroupId", submission.submissionGroupId),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("state"), "deleted"),
          q.neq(q.field("state"), "rejected"),
        ),
      )
      .collect();

    const metrics = await calculateGroupMetrics(ctx, {
      groupSubmissions,
      teamId: submission.teamId,
      tournamentId: submission.tournamentId,
    });

    await ctx.db.patch(submission.submissionGroupId, {
      state: metrics.groupState,
      tier: metrics.tier,
      participantCount: metrics.participantCount,
      totalTeamMembers: metrics.totalTeamMembers,
      participationRate: metrics.participationRate,
      isTeamExercise: metrics.isTeamExercise,
      pointsEarned: metrics.pointsEarned,
      managedBy: args.managedBy,
      updatedAt: nowUTC(),
    });

    const pointsPerSubmission =
      metrics.participantCount > 0
        ? metrics.pointsEarned / metrics.participantCount
        : 0;

    for (const groupSubmission of groupSubmissions) {
      await ctx.db.patch(groupSubmission._id, {
        pointsEarned: pointsPerSubmission,
        state: metrics.groupState,
        managedBy: args.managedBy,
      });
    }
  } else {
    const newPoints =
      submission.state === "approved"
        ? scoringConfig.individualPoints[tier]
        : 0;

    await ctx.db.patch(submission._id, {
      pointsEarned: newPoints,
      managedBy: args.managedBy,
    });
  }

  if (!args.skipTeamRecalculation) {
    await recalculateTeamPoints(ctx, submission.teamId);
  }

  const updatedSubmission = await ctx.db.get(args.submissionId);
  const newPoints = updatedSubmission?.pointsEarned || 0;
  return newPoints - oldPoints;
}

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

    return submissions.toSorted((a, b) => {
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

    if (submission.userId !== user._id)
      throw new Error("You are not the owner of this submission");

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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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
      // EDIT BRANCH — unchanged from pre-#34 behaviour
      const submission = await ctx.db.get(args._id);

      if (!submission) throw new Error("Submission not found");
      if (submission.createdBy !== user._id) {
        throw new Error("You do not have permission to update this submission");
      }
      if (submission.state === "approved") {
        throw new Error("You cannot update an approved submission");
      }

      const isDateChange = submission.date !== args.date;

      if (tournament.maxSubmissionsPerDay && isDateChange) {
        const existingSubmissions = await ctx.db
          .query("submissions")
          .withIndex("by_user_and_date", (q) =>
            q.eq("userId", user._id).eq("date", args.date),
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("tournamentId"), team.tournamentId),
              q.neq(q.field("state"), "deleted"),
            ),
          )
          .collect();

        if (existingSubmissions.length >= tournament.maxSubmissionsPerDay) {
          throw new Error(
            `Daily submission limit reached (${tournament.maxSubmissionsPerDay} per day). You have already submitted ${existingSubmissions.length} time(s) today.`,
          );
        }
      }

      const data = {
        date: toUTCDateString(args.date),
        userId: user._id,
        teamId: args.teamId,
        tournamentId: team.tournamentId,
        description: args.description,
        tier: args.tier || "base",
        submissionType: args.submissionType,
      };

      const typeChanged = submission.submissionType !== args.submissionType;

      await ctx.db.patch(args._id, data);
      submissionId = args._id;

      if (typeChanged) {
        const duplicateTeamSubmission = await ctx.db
          .query("submissions")
          .withIndex("by_team_and_date", (q) =>
            q.eq("teamId", args.teamId).eq("date", args.date),
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), user._id),
              q.eq(q.field("submissionType"), "team"),
              q.neq(q.field("state"), "deleted"),
              q.neq(q.field("_id"), args._id),
            ),
          )
          .first();

        if (duplicateTeamSubmission) {
          throw new Error(
            "You have already submitted for this team activity today",
          );
        }

        if (args.submissionType === "team") {
          await upsertSubmissionGroup(ctx, {
            teamId: args.teamId,
            tournamentId: team.tournamentId,
            date: args.date,
          });
        } else {
          if (submission.submissionGroupId) {
            await ctx.db.patch(submissionId, { submissionGroupId: undefined });

            await upsertSubmissionGroup(ctx, {
              teamId: args.teamId,
              tournamentId: team.tournamentId,
              date: args.date,
            });
          }
        }
      }

      if (args.submissionType === "team") {
        await upsertSubmissionGroup(ctx, {
          teamId: args.teamId,
          tournamentId: team.tournamentId,
          date: args.date,
        });
      }
    } else {
      // CREATE BRANCH — routed through lifecycle.submit (#34)
      submissionId = await lifecycleSubmit(ctx, {
        userId: user._id,
        teamId: args.teamId,
        date: args.date,
        type: args.submissionType,
        tier: args.tier,
        description: args.description,
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
    const isAdmin = hasMinimumRole(currentUser, "admin");
    const isTournamentManager = hasMinimumRole(
      currentUser,
      "tournament_manager",
    );

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", submission.teamId).eq("userId", currentUser._id),
      )
      .first();

    const isOwner = submission.userId === currentUser._id;
    const isTeamMember = !!membership;
    if (!isOwner && !isTeamMember && !isAdmin && !isTournamentManager) {
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

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();
    const totalTeamMembers = teamMembers.length;
    const participantCount = await getParticipantCount(ctx, submission);
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const scoringConfig = tournament?.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };
    const isTeamExercise =
      participationRate >= scoringConfig.teamExerciseThreshold;

    const canEdit = isOwner && submission.state !== "approved";
    const canApprove =
      (isAdmin || isTournamentManager) && submission.state === "pending";
    const canReject =
      (isAdmin || isTournamentManager) && submission.state === "pending";
    const canDelete =
      (isAdmin || isOwner || isTournamentManager) &&
      submission.state !== "deleted" &&
      submission.state !== "rejected";

    return {
      submission,
      team,
      tournament,
      submitter,
      teammates,
      managedByUser,
      isTeamExercise,
      canEdit,
      canApprove,
      canReject,
      canDelete,
    };
  },
});

export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const isAdmin = hasMinimumRole(user, "admin");
    const isTournamentManager = hasMinimumRole(user, "tournament_manager");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (!isAdmin && !isTournamentManager && submission.userId !== user._id) {
      throw new Error("You do not have permission to remove this submission");
    }

    if (submission.state === "deleted") {
      throw new Error("Submission already deleted");
    }

    if (submission.state === "rejected") {
      throw new Error("Cannot remove a rejected submission");
    }

    const previousState = submission.state;

    await ctx.db.patch(args.submissionId, {
      state: "deleted",
      managedBy: user._id,
    });

    if (submission.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: submission.teamId,
        tournamentId: submission.tournamentId,
        date: submission.date,
      });
    }

    await recalculateSubmissionPoints(ctx, {
      submissionId: args.submissionId,
      previousState,
      managedBy: user._id,
    });
  },
});

export const approve = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    validateMinimumRole(user, "reviewer", {
      customMessage:
        "You do not have permission to approve submissions for this tournament.",
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

    validateMinimumRole(user, "reviewer", {
      customMessage:
        "You do not have permission to reject submissions for this tournament.",
    });

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    await ctx.db.patch(args.submissionId, {
      state: "rejected",
      pointsEarned: 0,
      managedBy: user._id,
    });

    if (submission.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: submission.teamId,
        tournamentId: submission.tournamentId,
        date: submission.date,
      });
    }

    await recalculateTeamPoints(ctx, submission.teamId);

    // T026: Notify team members about submission rejection
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

    return submissions.reduce(
      (acc, sub) => {
        const dateKey = extractDateFromISO(sub.date);
        acc[dateKey] = {
          _id: sub._id,
          state: sub.state,
          description: sub.description,
          pointsEarned: sub.pointsEarned || 0,
          userId: sub.userId,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          _id: Id<"submissions">;
          state: "pending" | "approved" | "rejected" | "deleted";
          description: string | undefined;
          pointsEarned: number;
          userId: Id<"users">;
        }
      >,
    );
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

/**
 * Admin mutation to manually recalculate points for a submission.
 * This can be used to fix point discrepancies or after changing scoring rules.
 */
export const recalculatePoints = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const isAdmin = hasMinimumRole(user, "admin");
    const isTournamentManager = hasMinimumRole(user, "tournament_manager");

    if (!isAdmin && !isTournamentManager) {
      throw new Error(
        "Admin or Tournament Manager access required to recalculate submission points",
      );
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const pointsDiff = await recalculateSubmissionPoints(ctx, {
      submissionId: args.submissionId,
      previousState: submission.state,
      managedBy: user._id,
    });

    return {
      success: true,
      pointsDiff,
      message: `Points recalculated. Difference: ${pointsDiff}`,
    };
  },
});
