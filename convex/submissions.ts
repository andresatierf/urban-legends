import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { upsertSubmissionGroup } from "./submissionGroups";
import { recalculateTeamPoints } from "./teams";
import {
  getCurrentUserOrThrow,
  getRolesForUser,
  validateIsAdmin,
} from "./users";

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
  },
): Promise<number> {
  const submission = await ctx.db.get(args.submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  // Get tournament and team for scoring calculations
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

  // Calculate new points based on submission type and state
  if (submission.submissionType === "team" && submission.submissionGroupId) {
    // For team submissions, recalculate the entire group
    const group = await ctx.db.get(submission.submissionGroupId);
    if (!group) {
      // Group doesn't exist yet, will be created by upsertSubmissionGroup
      throw new Error("Group not found");
    }

    // Get all submissions in the group (excluding deleted and rejected ones)
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

    const participantCount = groupSubmissions.length;
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();

    const totalTeamMembers = teamMembers.length;
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const isTeamExercise =
      participationRate >= scoringConfig.teamExerciseThreshold;

    // Determine group tier (highest tier wins)
    const hasAdvanced = groupSubmissions.some((s) => s.tier === "advanced");
    const groupTier: "base" | "advanced" = hasAdvanced ? "advanced" : "base";

    // Determine group state (all must be same for approved, otherwise pending)
    const states = new Set(groupSubmissions.map((s) => s.state));
    let groupState: "pending" | "approved" | "rejected" | "deleted";

    if (states.size === 1) {
      groupState = Array.from(states)[0] as typeof groupState;
    } else {
      groupState = "pending";
    }

    // Calculate total group points if approved
    let totalGroupPoints = 0;
    if (groupState === "approved") {
      totalGroupPoints = isTeamExercise
        ? scoringConfig.teamExercisePoints[groupTier]
        : scoringConfig.individualPoints[groupTier];
    }

    // Update group
    await ctx.db.patch(submission.submissionGroupId, {
      state: groupState,
      tier: groupTier,
      participantCount,
      participationRate,
      isTeamExercise,
      pointsEarned: totalGroupPoints,
      managedBy: args.managedBy,
      updatedAt: new Date().toISOString(),
    });

    // Update all submissions in group with their share of points
    const pointsPerSubmission =
      participantCount > 0 ? totalGroupPoints / participantCount : 0;

    for (const groupSubmission of groupSubmissions) {
      await ctx.db.patch(groupSubmission._id, {
        pointsEarned: pointsPerSubmission,
        state: groupState,
        managedBy: args.managedBy,
      });
    }
  } else {
    // Individual submission
    const newPoints =
      submission.state === "approved"
        ? scoringConfig.individualPoints[tier]
        : 0;

    // Update submission points
    await ctx.db.patch(submission._id, {
      pointsEarned: newPoints,
      managedBy: args.managedBy,
    });
  }

  // Recalculate team points from all approved submissions
  // This ensures correctness even when group composition changes
  await recalculateTeamPoints(ctx, submission.teamId);

  return 0;
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
    submissionType: v.union(v.literal("individual"), v.literal("team")), // NEW - required
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate team membership
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

    // Get tournament for validation
    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    // CONSTRAINT: Check daily submission limit per user
    if (tournament.maxSubmissionsPerDay && !args._id) {
      // Count existing submissions for this user on this date
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

    // CONSTRAINT: Only one team activity group per team per day
    if (args.submissionType === "team") {
      const existingGroup = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team_and_date", (q) =>
          q.eq("teamId", args.teamId).eq("date", args.date),
        )
        .first();

      // Check if user already submitted for this team activity
      if (existingGroup && !args._id) {
        const userInGroup = await ctx.db
          .query("submissions")
          .withIndex("by_group", (q) =>
            q.eq("submissionGroupId", existingGroup._id),
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), user._id),
              q.neq(q.field("state"), "deleted"),
            ),
          )
          .first();

        if (userInGroup) {
          throw new Error(
            "You have already submitted for this team activity today",
          );
        }
        // Otherwise, user can join the existing group
      }
    }

    const data = {
      date: args.date,
      userId: user._id,
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      description: args.description,
      tier: args.tier || "base",
      submissionType: args.submissionType,
    };

    let submissionId: Id<"submissions">;

    if (args._id) {
      // UPDATE EXISTING SUBMISSION
      const submission = await ctx.db.get(args._id);

      if (!submission) throw new Error("Submission not found");
      if (submission.createdBy !== user._id) {
        throw new Error("You do not have permission to update this submission");
      }
      if (submission.state === "approved") {
        throw new Error("You cannot update an approved submission");
      }

      // If changing submission type, need to handle grouping changes
      const typeChanged = submission.submissionType !== args.submissionType;

      await ctx.db.patch(args._id, data);
      submissionId = args._id;

      // If type changed, update groups accordingly
      if (typeChanged) {
        if (args.submissionType === "team") {
          // Changed from individual to team - create/join group
          await upsertSubmissionGroup(ctx, {
            teamId: args.teamId,
            tournamentId: team.tournamentId,
            date: args.date,
          });
        } else {
          // Changed from team to individual - remove from group
          if (submission.submissionGroupId) {
            await ctx.db.patch(submissionId, { submissionGroupId: undefined });
            // Recalculate group without this submission
            await upsertSubmissionGroup(ctx, {
              teamId: args.teamId,
              tournamentId: team.tournamentId,
              date: args.date,
            });
          }
        }
      }
    } else {
      // CREATE NEW SUBMISSION
      submissionId = await ctx.db.insert("submissions", {
        ...data,
        state: "pending",
        createdBy: user._id,
        pointsEarned: 0, // Will be calculated on approval
        submissionGroupId: undefined,
      });
    }

    // UPSERT SUBMISSION GROUP (only for team activities)
    if (args.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: args.teamId,
        tournamentId: team.tournamentId,
        date: args.date,
      });
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
    const isAdmin = currentUser.roleNames.includes("admin");

    // Fetch submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check if user is team member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", submission.teamId).eq("userId", currentUser._id),
      )
      .first();

    // Permission check: must be owner, team member, or admin
    const isOwner = submission.userId === currentUser._id;
    const isTeamMember = !!membership;
    if (!isOwner && !isTeamMember && !isAdmin) {
      throw new Error("You do not have permission to view this submission");
    }

    // Fetch related entities
    const [team, tournament, submitter] = await Promise.all([
      ctx.db.get(submission.teamId),
      ctx.db.get(submission.tournamentId),
      ctx.db.get(submission.userId),
    ]);

    if (!submitter) {
      throw new Error("Submitter not found");
    }

    // Fetch submitter with roles
    const submitterRoles = await getRolesForUser(ctx, submitter._id);
    const submitterWithRoles = {
      ...submitter,
      roles: submitterRoles,
      roleNames: submitterRoles.map(({ name }) => name),
    };

    // Fetch teammates (if they exist)
    const teammates = submission.teammates
      ? await Promise.all(
          submission.teammates.map(async (teammateId) => {
            const user = await ctx.db.get(teammateId);
            if (!user) return null;
            const roles = await getRolesForUser(ctx, user._id);
            return {
              ...user,
              roles,
              roleNames: roles.map(({ name }) => name),
            };
          }),
        )
      : [];
    const validTeammates = teammates.filter(
      (t): t is NonNullable<typeof t> => t !== null,
    );

    // Fetch managedBy user if exists
    let managedByUser = null;
    if (submission.managedBy) {
      const managedUser = await ctx.db.get(submission.managedBy);
      if (managedUser) {
        const roles = await getRolesForUser(ctx, managedUser._id);
        managedByUser = {
          ...managedUser,
          roles,
          roleNames: roles.map(({ name }) => name),
        };
      }
    }

    // Calculate if this is a team exercise
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();
    const totalTeamMembers = teamMembers.length;
    const participantCount = Math.min(
      totalTeamMembers,
      (submission.teammates?.length || 0) + 1,
    );
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const scoringConfig = tournament?.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };
    const isTeamExercise =
      participationRate >= scoringConfig.teamExerciseThreshold;

    // Calculate permissions
    const canEdit = isOwner && submission.state !== "approved";
    const canApprove = isAdmin && submission.state === "pending";
    const canReject = isAdmin && submission.state === "pending";
    const canDelete =
      (isAdmin || isOwner) &&
      submission.state !== "deleted" &&
      submission.state !== "rejected";

    return {
      submission,
      team,
      tournament,
      submitter: submitterWithRoles,
      teammates: validTeammates,
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
    const isAdmin = user.roleNames.includes("admin");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (!isAdmin && submission.userId !== user._id) {
      throw new Error("You do not have permission to remove this submission");
    }

    if (submission.state === "deleted") {
      throw new Error("Submission already deleted");
    }

    if (submission.state === "rejected") {
      throw new Error("Cannot remove a rejected submission");
    }

    const previousState = submission.state;

    // Mark submission as deleted
    await ctx.db.patch(args.submissionId, {
      state: "deleted",
      managedBy: user._id,
    });

    // For team submissions, ensure group exists before recalculating
    if (submission.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: submission.teamId,
        tournamentId: submission.tournamentId,
        date: submission.date,
      });
    }

    // Recalculate points for this submission (and its group if applicable)
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

    // FIX: should be reviewer and up
    validateIsAdmin(
      user,
      "You do not have permission to approve this submission",
    );

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const previousState = submission.state;

    // For team submissions, approve ALL submissions in the group
    if (submission.submissionType === "team" && submission.submissionGroupId) {
      // Get all submissions in the group (excluding deleted and rejected)
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

      // Update all submissions in group to approved
      for (const groupSubmission of groupSubmissions) {
        await ctx.db.patch(groupSubmission._id, {
          state: "approved",
          managedBy: user._id,
        });
      }
    } else {
      // Individual submission - just update this one
      await ctx.db.patch(args.submissionId, {
        state: "approved",
        managedBy: user._id,
      });
    }

    // For team submissions, ensure group exists before recalculating
    if (submission.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: submission.teamId,
        tournamentId: submission.tournamentId,
        date: submission.date,
      });
    }

    // Recalculate points for this submission (and its group if applicable)
    await recalculateSubmissionPoints(ctx, {
      submissionId: args.submissionId,
      previousState,
      managedBy: user._id,
    });
  },
});

export const reject = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(
      user,
      "You do not have permission to reject this submission",
    );

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Update submission state to rejected and clear points
    await ctx.db.patch(args.submissionId, {
      state: "rejected",
      pointsEarned: 0,
      managedBy: user._id,
    });

    // For team submissions, update the group (rejected submission will be excluded)
    if (submission.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: submission.teamId,
        tournamentId: submission.tournamentId,
        date: submission.date,
      });
    }

    // Recalculate team points from all approved submissions
    await recalculateTeamPoints(ctx, submission.teamId);
  },
});

export const getMonthSubmissions = query({
  args: {
    teamId: v.id("teams"),
    userId: v.optional(v.id("users")),
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user is member of team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    // Calculate date range for month
    const startDate = `${args.year}-${String(args.month).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(args.year, args.month, 0).getDate();
    const endDate = `${args.year}-${String(args.month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

    // Fetch submissions for month
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

    // Return map of date -> submission
    return submissions.reduce(
      (acc, sub) => {
        acc[sub.date] = {
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

    // Validate user is member of team
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

    // If tournament hasn't started yet, return zeros
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

    // Calculate streak - count backwards from today
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

      // Skip if date is before tournament start
      if (date < startDate) break;

      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        // Only break if this is not today (allow for today not being submitted yet)
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

    // Validate user is member of team
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

    // If tournament hasn't started yet, return zeros
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

    // Calculate streak - count backwards from today
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

      // Skip if date is before tournament start
      if (date < startDate) break;

      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        // Only break if this is not today (allow for today not being submitted yet)
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

    validateIsAdmin(
      user,
      "You do not have permission to recalculate submission points",
    );

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
