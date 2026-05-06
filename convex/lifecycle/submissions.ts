import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { nowUTC, toUTCDateString } from "../lib/dates";

export type ScoringConfig = {
  individualPoints: { base: number; advanced: number };
  teamExercisePoints: { base: number; advanced: number };
  teamExerciseThreshold: number;
};

export function score(
  scoringConfig: ScoringConfig,
  tier: "base" | "advanced",
  isTeamExercise: boolean,
): number {
  return isTeamExercise
    ? scoringConfig.teamExercisePoints[tier]
    : scoringConfig.individualPoints[tier];
}

export function previewIsTeamExercise({
  participantCount,
  totalTeamMembers,
  threshold,
}: {
  participantCount: number;
  totalTeamMembers: number;
  threshold: number;
}): boolean {
  if (totalTeamMembers === 0) return false;
  return participantCount / totalTeamMembers >= threshold;
}

// Recomputes SubmissionGroup metrics for all active team submissions on (teamId, date).
// Deletes the group when no active team submissions remain.
// Uses JS-side filtering to stay compatible with convex-test@0.0.1.
async function cascade(
  ctx: MutationCtx,
  args: {
    teamId: Id<"teams">;
    tournamentId: Id<"tournaments">;
    date: string;
  },
): Promise<void> {
  const allForDate = await ctx.db
    .query("submissions")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date),
    )
    .collect();

  const active = allForDate.filter(
    (s) =>
      s.submissionType === "team" &&
      s.state !== "deleted" &&
      s.state !== "rejected",
  );

  const existingGroup = await ctx.db
    .query("submissionGroups")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date),
    )
    .first();

  if (active.length === 0) {
    if (existingGroup) await ctx.db.delete(existingGroup._id);
    return;
  }

  const tournament = await ctx.db.get(args.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  const sc = tournament.scoringConfig;
  const totalTeamMembers = teamMembers.length;
  const participantCount = active.length;
  const participationRate =
    totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
  const isTeamExercise = participationRate >= sc.teamExerciseThreshold;
  const tier: "base" | "advanced" = active.some((s) => s.tier === "advanced")
    ? "advanced"
    : "base";

  const states = new Set(active.map((s) => s.state));
  const groupState = (states.size === 1 ? Array.from(states)[0] : "pending") as
    | "pending"
    | "approved"
    | "rejected"
    | "deleted";

  const pointsEarned =
    groupState === "approved"
      ? isTeamExercise
        ? sc.teamExercisePoints[tier]
        : sc.individualPoints[tier]
      : 0;

  const now = nowUTC();
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

  let groupId: Id<"submissionGroups">;
  if (existingGroup) {
    await ctx.db.patch(existingGroup._id, groupData);
    groupId = existingGroup._id;
  } else {
    groupId = await ctx.db.insert("submissionGroups", {
      ...groupData,
      createdAt: now,
    });
  }

  for (const sub of active) {
    await ctx.db.patch(sub._id, {
      submissionGroupId: groupId,
      pointsEarned: 0,
    });
  }
}

// Removes a submission from its SubmissionGroup and cascades group metrics.
// Used by the edit and softDelete verbs (implemented in later slices).
async function evictFromGroup(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
): Promise<void> {
  const submission = await ctx.db.get(submissionId);
  if (!submission?.submissionGroupId) return;

  await ctx.db.patch(submissionId, { submissionGroupId: undefined });

  await cascade(ctx, {
    teamId: submission.teamId,
    tournamentId: submission.tournamentId,
    date: submission.date,
  });
}

// Ensures there is a SubmissionGroup for (teamId, date) and cascades metrics.
async function joinOrCreateGroup(
  ctx: MutationCtx,
  args: {
    teamId: Id<"teams">;
    tournamentId: Id<"tournaments">;
    date: string;
  },
): Promise<void> {
  await cascade(ctx, args);
}

// Creates a new Submission and, for team-type, joins or creates its SubmissionGroup.
// Enforces daily submission limit and duplicate team-submission guard.
// Does not handle authorization or notifications — those stay in the mutation shell.
export async function submit(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    date: string;
    type: "individual" | "team";
    tier?: "base" | "advanced";
    description?: string;
  },
): Promise<Id<"submissions">> {
  const team = await ctx.db.get(args.teamId);
  if (!team) throw new Error("Team not found");

  const tournament = await ctx.db.get(team.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const date = toUTCDateString(args.date);

  if (tournament.maxSubmissionsPerDay) {
    // JS-side filter avoids convex-test@0.0.1 q.and() incompatibility
    const allOnDate = await ctx.db
      .query("submissions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", date),
      )
      .collect();

    const count = allOnDate.filter(
      (s) => s.tournamentId === team.tournamentId && s.state !== "deleted",
    ).length;

    if (count >= tournament.maxSubmissionsPerDay) {
      throw new Error(
        `Daily submission limit reached (${tournament.maxSubmissionsPerDay} per day). You have already submitted ${count} time(s) today.`,
      );
    }
  }

  if (args.type === "team") {
    const existingGroup = await ctx.db
      .query("submissionGroups")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", date),
      )
      .first();

    if (existingGroup) {
      // JS-side filter avoids convex-test@0.0.1 q.and() incompatibility
      const groupSubs = await ctx.db
        .query("submissions")
        .withIndex("by_group", (q) =>
          q.eq("submissionGroupId", existingGroup._id),
        )
        .collect();

      const alreadyIn = groupSubs.find(
        (s) =>
          s.userId === args.userId &&
          s.state !== "rejected" &&
          s.state !== "deleted",
      );

      if (alreadyIn) {
        throw new Error(
          "You have already submitted for this team activity today",
        );
      }
    }
  }

  const submissionId = await ctx.db.insert("submissions", {
    userId: args.userId,
    teamId: args.teamId,
    tournamentId: team.tournamentId,
    date,
    description: args.description,
    tier: args.tier ?? "base",
    submissionType: args.type,
    state: "pending",
    createdBy: args.userId,
    pointsEarned: 0,
    submissionGroupId: undefined,
  });

  if (args.type === "team") {
    await joinOrCreateGroup(ctx, {
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      date,
    });
  }

  return submissionId;
}

// evictFromGroup exported for use by later lifecycle slices (edit, softDelete).
export { evictFromGroup };
