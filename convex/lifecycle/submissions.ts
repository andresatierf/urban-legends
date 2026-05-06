import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { nowUTC, toUTCDateString } from "../lib/dates";

export class IllegalTransition extends Error {
  constructor(from: string, to: string) {
    super(`Illegal state transition: ${from} → ${to}`);
    this.name = "IllegalTransition";
  }
}

// Validates and patches a single submission's state.
// Returns "noop" if already in the target state (idempotent).
// Throws IllegalTransition for any forbidden move.
async function transition(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  to: "approved" | "rejected" | "deleted",
  managedBy: Id<"users">,
): Promise<"noop" | "changed"> {
  const sub = await ctx.db.get(submissionId);
  if (!sub) throw new Error("Submission not found");

  const from = sub.state;
  if (from === to) return "noop";

  // rejected and deleted are terminal — no outbound transitions allowed
  if (from === "rejected" || from === "deleted") {
    throw new IllegalTransition(from, to);
  }

  // approved may move forward to rejected or deleted (e.g. admin correction), but not back
  await ctx.db.patch(submissionId, { state: to, managedBy });
  return "changed";
}

// Recomputes team.points as the sum of all approved submission pointsEarned.
async function updateTeamPoints(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<void> {
  const approved = await ctx.db
    .query("submissions")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .filter((q) => q.eq(q.field("state"), "approved"))
    .collect();
  const total = approved.reduce((sum, s) => sum + (s.pointsEarned ?? 0), 0);
  await ctx.db.patch(teamId, { points: total, lastActivityAt: nowUTC() });
}

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

// Approves a submission (and its full SubmissionGroup for team-type).
// Idempotent on already-approved submissions. Throws IllegalTransition for
// terminal source states (rejected/deleted). Memoises team-points recompute.
export async function approve(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  by: Id<"users">,
): Promise<{ pointsDelta: number; affected: Id<"submissions">[] }> {
  const submission = await ctx.db.get(submissionId);
  if (!submission) throw new Error("Submission not found");

  if (submission.state === "approved") {
    return { pointsDelta: 0, affected: [] };
  }

  if (submission.state === "rejected" || submission.state === "deleted") {
    throw new IllegalTransition(submission.state, "approved");
  }

  const oldTeamPoints = (await ctx.db.get(submission.teamId))?.points ?? 0;
  const tournament = await ctx.db.get(submission.tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  const sc = tournament.scoringConfig;
  const affected: Id<"submissions">[] = [];

  if (
    submission.submissionType === "individual" ||
    !submission.submissionGroupId
  ) {
    await transition(ctx, submissionId, "approved", by);
    const pts = sc.individualPoints[submission.tier ?? "base"];
    await ctx.db.patch(submissionId, { pointsEarned: pts });
    affected.push(submissionId);
  } else {
    // Team-type: approve every non-terminal sibling in the group
    const groupId = submission.submissionGroupId as Id<"submissionGroups">;
    const groupSubs = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", groupId))
      .collect();

    const nonTerminal = groupSubs.filter(
      (s) => s.state !== "rejected" && s.state !== "deleted",
    );

    for (const sub of nonTerminal) {
      const r = await transition(ctx, sub._id, "approved", by);
      if (r === "changed") affected.push(sub._id);
    }

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();

    const participantCount = nonTerminal.length;
    const totalTeamMembers = teamMembers.length;
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const isTeamExercise = participationRate >= sc.teamExerciseThreshold;
    const tier: "base" | "advanced" = nonTerminal.some(
      (s) => s.tier === "advanced",
    )
      ? "advanced"
      : "base";
    const groupPoints = isTeamExercise
      ? sc.teamExercisePoints[tier]
      : sc.individualPoints[tier];

    await ctx.db.patch(groupId, {
      state: "approved",
      tier,
      participantCount,
      totalTeamMembers,
      participationRate,
      isTeamExercise,
      pointsEarned: groupPoints,
      managedBy: by,
      updatedAt: nowUTC(),
    });

    const pointsPerSub =
      participantCount > 0 ? groupPoints / participantCount : 0;
    for (const sub of nonTerminal) {
      await ctx.db.patch(sub._id, { pointsEarned: pointsPerSub });
    }
  }

  await updateTeamPoints(ctx, submission.teamId);
  const newTeamPoints = (await ctx.db.get(submission.teamId))?.points ?? 0;
  return { pointsDelta: newTeamPoints - oldTeamPoints, affected };
}

// Rejects a submission (and its full SubmissionGroup for team-type).
// Idempotent on already-rejected submissions. Throws IllegalTransition for
// deleted source state. Handles approved→rejected (removes points from team total).
export async function reject(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  by: Id<"users">,
): Promise<{ pointsDelta: number }> {
  const submission = await ctx.db.get(submissionId);
  if (!submission) throw new Error("Submission not found");

  if (submission.state === "rejected") {
    return { pointsDelta: 0 };
  }

  if (submission.state === "deleted") {
    throw new IllegalTransition("deleted", "rejected");
  }

  const oldTeamPoints = (await ctx.db.get(submission.teamId))?.points ?? 0;

  if (
    submission.submissionType === "individual" ||
    !submission.submissionGroupId
  ) {
    await transition(ctx, submissionId, "rejected", by);
    await ctx.db.patch(submissionId, { pointsEarned: 0 });
  } else {
    const groupId = submission.submissionGroupId as Id<"submissionGroups">;
    const groupSubs = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", groupId))
      .collect();

    const nonTerminal = groupSubs.filter(
      (s) => s.state !== "rejected" && s.state !== "deleted",
    );

    for (const sub of nonTerminal) {
      await transition(ctx, sub._id, "rejected", by);
      await ctx.db.patch(sub._id, { pointsEarned: 0 });
    }

    await ctx.db.patch(groupId, {
      state: "rejected",
      pointsEarned: 0,
      managedBy: by,
      updatedAt: nowUTC(),
    });
  }

  await updateTeamPoints(ctx, submission.teamId);
  const newTeamPoints = (await ctx.db.get(submission.teamId))?.points ?? 0;
  return { pointsDelta: newTeamPoints - oldTeamPoints };
}

// Soft-deletes a single submission (and cascades group metrics for team-type).
// Only the target row transitions to deleted — siblings are not touched.
// Idempotent on already-deleted; throws IllegalTransition for rejected source state.
export async function softDelete(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  by: Id<"users">,
): Promise<{ pointsDelta: number }> {
  const submission = await ctx.db.get(submissionId);
  if (!submission) throw new Error("Submission not found");

  if (submission.state === "deleted") {
    return { pointsDelta: 0 };
  }

  if (submission.state === "rejected") {
    throw new IllegalTransition("rejected", "deleted");
  }

  const oldTeamPoints = (await ctx.db.get(submission.teamId))?.points ?? 0;

  await transition(ctx, submissionId, "deleted", by);
  await ctx.db.patch(submissionId, { pointsEarned: 0 });

  if (submission.submissionType === "team") {
    // Cascade recomputes group metrics excluding the now-deleted submission.
    // The active filter in cascade excludes deleted state, so no eviction needed.
    await cascade(ctx, {
      teamId: submission.teamId,
      tournamentId: submission.tournamentId,
      date: submission.date,
    });
  }

  await updateTeamPoints(ctx, submission.teamId);
  const newTeamPoints = (await ctx.db.get(submission.teamId))?.points ?? 0;
  return { pointsDelta: newTeamPoints - oldTeamPoints };
}

// evictFromGroup exported for use by later lifecycle slices (edit, softDelete).
export { evictFromGroup };
