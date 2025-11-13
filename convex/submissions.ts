import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

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
    teammateIds: v.array(v.id("users")),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
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

    const data = {
      date: args.date,
      userId: user._id,
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      description: args.description,
      teammates: args.teammateIds,
      tier: args.tier || "base",
    };

    if (args._id) {
      const submission = await ctx.db.get(args._id);

      if (!submission) throw new Error("Submission not found");

      if (submission.createdBy !== user._id) {
        throw new Error("You do not have permission to update this submission");
      }

      if (submission.state === "approved") {
        throw new Error("You cannot update an approved submission");
      }

      return await ctx.db.patch(args._id, data);
    }

    return await ctx.db.insert("submissions", {
      ...data,
      state: "pending",
      createdBy: user._id,
      pointsEarned: 0, // Will be calculated on approval
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

export const getById = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    return await ctx.db.get(args.id);
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
    const previousPoints = submission.pointsEarned || 0;

    await ctx.db.patch(args.submissionId, {
      state: "deleted",
      managedBy: user._id,
    });

    // Decrement points if the submission was approved before deletion
    if (previousState === "approved" && previousPoints > 0) {
      const team = await ctx.db.get(submission.teamId);
      if (team) {
        const currentPoints = team.points ?? 0;
        await ctx.db.patch(submission.teamId, {
          points: Math.max(0, currentPoints - previousPoints),
          lastActivityAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const getUserSubmissions = query({
  args: {
    teamId: v.id("teams"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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
    await getCurrentUserOrThrow(ctx);

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

    validateIsAdmin(
      user,
      "You do not have permission to approve this submission",
    );

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const previousState = submission.state;

    // Get tournament to access scoring config
    const tournament = await ctx.db.get(submission.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Get team and team members for scoring calculation
    const team = await ctx.db.get(submission.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();

    // Calculate points based on tier and team exercise
    let pointsEarned = 0;
    const tier = submission.tier || "base";
    const scoringConfig = tournament.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    // Determine if this is a team exercise
    const totalTeamMembers = teamMembers.length;
    const participantCount = Math.min(
      totalTeamMembers,
      submission.teammates.length + 1,
    );
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const isTeamExercise =
      participationRate >= scoringConfig.teamExerciseThreshold;

    if (isTeamExercise) {
      pointsEarned = scoringConfig.teamExercisePoints[tier];
    } else {
      pointsEarned = scoringConfig.individualPoints[tier];
    }

    await ctx.db.patch(args.submissionId, {
      state: "approved",
      managedBy: user._id,
      pointsEarned,
    });

    const currentPoints = team.points ?? 0;

    // Only increment points if transitioning from non-approved state to approved
    if (previousState !== "approved") {
      await ctx.db.patch(submission.teamId, {
        points: currentPoints + pointsEarned,
        lastActivityAt: new Date().toISOString(),
      });
    } else if (submission.pointsEarned !== pointsEarned) {
      // Re-approval with different points (e.g., tier changed)
      const pointsDiff = pointsEarned - (submission.pointsEarned || 0);
      await ctx.db.patch(submission.teamId, {
        points: currentPoints + pointsDiff,
        lastActivityAt: new Date().toISOString(),
      });
    }
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

    const previousState = submission.state;
    const previousPoints = submission.pointsEarned || 0;

    await ctx.db.patch(args.submissionId, {
      state: "rejected",
      managedBy: user._id,
    });

    // Only decrement points if transitioning from approved state to rejected
    if (previousState === "approved" && previousPoints > 0) {
      const team = await ctx.db.get(submission.teamId);
      if (team) {
        const currentPoints = team.points ?? 0;
        await ctx.db.patch(submission.teamId, {
          points: Math.max(0, currentPoints - previousPoints),
          lastActivityAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const getMonthSubmissions = query({
  args: {
    teamId: v.id("teams"),
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
      .withIndex("by_team_and_date", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate),
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
        }
      >,
    );
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
    today.setHours(0, 0, 0, 0);

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

    const totalDays =
      Math.floor(
        (relevantEndDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const daysWithSubmissions = new Set(submissions.map((s) => s.date)).size;
    const completionRate =
      totalDays > 0 ? (daysWithSubmissions / totalDays) * 100 : 0;

    // Calculate streak - count backwards from today
    let currentStreak = 0;
    const sortedDates = Array.from(
      new Set(submissions.map((s) => s.date)),
    ).sort();

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

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
      approved: submissions.filter((s) => s.state === "approved").length,
      pending: submissions.filter((s) => s.state === "pending").length,
      rejected: submissions.filter((s) => s.state === "rejected").length,
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
