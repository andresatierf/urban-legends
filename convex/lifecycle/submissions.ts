import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { claimUploads, releaseUploads } from "../evidenceStorage";
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
  options?: { rejectionReason?: string },
): Promise<"noop" | "changed"> {
  const sub = await ctx.db.get(submissionId);
  if (!sub) throw new Error("Submission not found");

  const from = sub.state;
  if (from === to) return "noop";

  // rejected and deleted are terminal; no outbound transitions allowed
  if (from === "rejected" || from === "deleted") {
    throw new IllegalTransition(from, to);
  }

  // approved is locked-in for scoring purposes: it can only be softDeleted,
  // not re-reviewed. Admin correction is via delete + new submission.
  if (from === "approved" && to === "rejected") {
    throw new IllegalTransition(from, to);
  }

  const isReview = to === "approved" || to === "rejected";
  await ctx.db.patch(submissionId, {
    state: to,
    managedBy,
    ...(isReview && { reviewedAt: Date.now() }),
    ...(to === "rejected" && options?.rejectionReason
      ? { rejectionReason: options.rejectionReason }
      : {}),
  });
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
  await recomputeRecentActivity(ctx, teamId);
}

// Returns the last 7 calendar dates (UTC) ending today, oldest → newest.
export function last7Dates(today: Date = new Date()): string[] {
  const base = new Date(today);
  base.setUTCHours(0, 0, 0, 0);
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

// Recomputes the precomputed 7-day activity rollup on the team.
export async function recomputeRecentActivity(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<void> {
  const dates = last7Dates();
  const startDate = dates[0];

  const submissions = await ctx.db
    .query("submissions")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", teamId).gte("date", startDate),
    )
    .collect();

  const buckets = new Map<
    string,
    { approved: number; pending: number; rejected: number; points: number }
  >();
  for (const date of dates) {
    buckets.set(date, { approved: 0, pending: 0, rejected: 0, points: 0 });
  }

  for (const s of submissions) {
    // s.date may be either YYYY-MM-DD or full ISO (e.g. "2024-01-15T00:00:00.000Z")
    // depending on insertion path. Bucket by the calendar day prefix.
    const bucket = buckets.get(s.date.slice(0, 10));
    if (!bucket) continue;
    if (s.state === "approved") {
      bucket.approved++;
      bucket.points += s.pointsEarned ?? 0;
    } else if (s.state === "pending") bucket.pending++;
    else if (s.state === "rejected") bucket.rejected++;
  }

  await ctx.db.patch(teamId, {
    recentActivity: {
      updatedAt: nowUTC(),
      days: dates.map((date) => ({ date, ...buckets.get(date)! })),
    },
  });
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
// Does not handle authorization or notifications; those stay in the mutation shell.
export async function submit(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    date: string;
    type: "individual" | "team";
    tier?: "base" | "advanced";
    description?: string;
    evidenceStorageIds?: Id<"_storage">[];
  },
): Promise<Id<"submissions">> {
  if (args.evidenceStorageIds !== undefined) {
    if (args.evidenceStorageIds.length === 0) {
      throw new Error("A Submission requires at least 1 Evidence image");
    }
    if (args.evidenceStorageIds.length > 5) {
      throw new Error("A Submission allows a maximum 5 Evidence images");
    }
  }

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
    evidenceStorageIds: args.evidenceStorageIds ?? [],
  });

  const evidenceIds = args.evidenceStorageIds ?? [];
  if (evidenceIds.length > 0) {
    await claimUploads(ctx, args.userId, evidenceIds);
  }

  if (args.type === "team") {
    await joinOrCreateGroup(ctx, {
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      date,
    });
  }

  await recomputeRecentActivity(ctx, args.teamId);

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
  options?: { rejectionReason?: string },
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
    await transition(ctx, submissionId, "rejected", by, options);
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
      await transition(ctx, sub._id, "rejected", by, options);
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
// Only the target row transitions to deleted; siblings are not touched.
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
  await releaseUploads(ctx, submission.evidenceStorageIds ?? []);
  await ctx.db.patch(submissionId, { pointsEarned: 0, evidenceStorageIds: [] });

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

// Edits a pending submission's fields, reconciling SubmissionGroup membership
// when date or type changes. Throws IllegalTransition for non-pending source states.
//
// Avoids the convex-test $undefined serialization bug by applying the main patch
// first, then letting cascade naturally exclude the submission via type/date filter,
// and only clearing submissionGroupId as the very last write (after all index queries).
export async function edit(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  patch: {
    date?: string;
    type?: "individual" | "team";
    tier?: "base" | "advanced";
    description?: string;
    evidenceStorageIds?: Id<"_storage">[];
  },
  by: Id<"users">,
): Promise<void> {
  const submission = await ctx.db.get(submissionId);
  if (!submission) throw new Error("Submission not found");

  if (submission.state !== "pending") {
    throw new IllegalTransition(submission.state, "pending");
  }

  if (patch.evidenceStorageIds !== undefined) {
    const newIds = patch.evidenceStorageIds;
    if (newIds.length === 0) {
      throw new Error("A Submission requires at least 1 Evidence image");
    }
    if (newIds.length > 5) {
      throw new Error("A Submission allows a maximum 5 Evidence images");
    }
    const currentIds = submission.evidenceStorageIds ?? [];
    const added = newIds.filter((id) => !currentIds.includes(id));
    const removed = currentIds.filter((id) => !newIds.includes(id));
    if (added.length > 0) await claimUploads(ctx, by, added);
    if (removed.length > 0) await releaseUploads(ctx, removed);
  }

  const newDate = patch.date ? toUTCDateString(patch.date) : submission.date;
  const newType = patch.type ?? submission.submissionType;

  const dateChanged = newDate !== submission.date;
  const typeChanged = newType !== submission.submissionType;

  // Enforce duplicate-team-submission guard for the new (team, date) before writing
  if (newType === "team" && (typeChanged || dateChanged)) {
    const allOnDate = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", submission.teamId).eq("date", newDate),
      )
      .collect();

    const alreadyIn = allOnDate.find(
      (s) =>
        s.userId === submission.userId &&
        s.submissionType === "team" &&
        s.state !== "rejected" &&
        s.state !== "deleted" &&
        s._id !== submissionId,
    );

    if (alreadyIn) {
      throw new Error(
        "You have already submitted for this team activity today",
      );
    }
  }

  const oldDate = submission.date;
  const wasTeamInGroup =
    submission.submissionType === "team" && !!submission.submissionGroupId;

  // Apply the main patch first so cascade can use the new date/type to exclude this
  // submission from the old group naturally, without patching submissionGroupId to undefined.
  await ctx.db.patch(submissionId, {
    ...(patch.date !== undefined && { date: newDate }),
    ...(patch.type !== undefined && { submissionType: newType }),
    ...(patch.tier !== undefined && { tier: patch.tier }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.evidenceStorageIds !== undefined && {
      evidenceStorageIds: patch.evidenceStorageIds,
    }),
  });

  // If the submission was in a group and date or type changed, cascade on the OLD date.
  // Because the submission now has the new date/type, cascade's active filter naturally
  // excludes it; the old group is recomputed or deleted without any extra patch needed.
  if (wasTeamInGroup && (dateChanged || typeChanged)) {
    await cascade(ctx, {
      teamId: submission.teamId,
      tournamentId: submission.tournamentId,
      date: oldDate,
    });
  }

  // Join or create group for new (team, date). cascade will patch submissionGroupId
  // on all active subs for the new slot, including this one.
  if (newType === "team") {
    await joinOrCreateGroup(ctx, {
      teamId: submission.teamId,
      tournamentId: submission.tournamentId,
      date: newDate,
    });
  }

  await recomputeRecentActivity(ctx, submission.teamId);
}

// evictFromGroup exported for use by later lifecycle slices (edit, softDelete).
export { evictFromGroup };

// Re-derives pointsEarned for every affected submission and group on a team,
// then reconciles team.points. Never changes submission state.
async function recomputeForTeam(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<{ submissionsTouched: number }> {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");
  const tournament = await ctx.db.get(team.tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  const sc = tournament.scoringConfig;

  const allSubmissions = await ctx.db
    .query("submissions")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  let submissionsTouched = 0;

  // Individual submissions: re-derive points directly from current scoring config.
  for (const sub of allSubmissions.filter(
    (s) => s.submissionType === "individual",
  )) {
    const pts = sub.state === "approved" ? sc.individualPoints[sub.tier] : 0;
    await ctx.db.patch(sub._id, { pointsEarned: pts });
    submissionsTouched++;
  }

  // Team submissions: recompute each (teamId, date) slot.
  const teamSubs = allSubmissions.filter((s) => s.submissionType === "team");
  const dates = Array.from(new Set(teamSubs.map((s) => s.date)));

  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
  const totalTeamMembers = teamMembers.length;

  for (const date of dates) {
    const forDate = teamSubs.filter((s) => s.date === date);
    const active = forDate.filter(
      (s) => s.state !== "deleted" && s.state !== "rejected",
    );

    const group = await ctx.db
      .query("submissionGroups")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", teamId).eq("date", date),
      )
      .first();

    if (active.length === 0) {
      if (group) await ctx.db.delete(group._id);
      for (const sub of forDate) {
        await ctx.db.patch(sub._id, { pointsEarned: 0 });
        submissionsTouched++;
      }
      continue;
    }

    const participantCount = active.length;
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const isTeamExercise = participationRate >= sc.teamExerciseThreshold;
    const tier: "base" | "advanced" = active.some((s) => s.tier === "advanced")
      ? "advanced"
      : "base";

    const states = new Set(active.map((s) => s.state));
    const groupState = (
      states.size === 1 ? Array.from(states)[0] : "pending"
    ) as "pending" | "approved" | "rejected" | "deleted";

    const groupPoints =
      groupState === "approved"
        ? isTeamExercise
          ? sc.teamExercisePoints[tier]
          : sc.individualPoints[tier]
        : 0;

    if (group) {
      await ctx.db.patch(group._id, {
        state: groupState,
        tier,
        participantCount,
        totalTeamMembers,
        participationRate,
        isTeamExercise,
        pointsEarned: groupPoints,
        updatedAt: nowUTC(),
      });
    }

    const pointsPerSub =
      participantCount > 0 ? groupPoints / participantCount : 0;
    for (const sub of active) {
      await ctx.db.patch(sub._id, { pointsEarned: pointsPerSub });
      submissionsTouched++;
    }

    for (const sub of forDate.filter(
      (s) => s.state === "deleted" || s.state === "rejected",
    )) {
      await ctx.db.patch(sub._id, { pointsEarned: 0 });
      submissionsTouched++;
    }
  }

  await updateTeamPoints(ctx, teamId);
  return { submissionsTouched };
}

// Recomputes pointsEarned for every submission (and group) affected by the
// given scope, then reconciles team.points for every affected team.
// Never changes submission state. Idempotent.
export async function recompute(
  ctx: MutationCtx,
  scope:
    | { kind: "submission"; id: Id<"submissions"> }
    | { kind: "group"; id: Id<"submissionGroups"> }
    | { kind: "team"; id: Id<"teams"> }
    | { kind: "tournament"; id: Id<"tournaments"> },
  _by: Id<"users">,
): Promise<{ submissionsTouched: number; teamsTouched: number }> {
  if (scope.kind === "submission") {
    const sub = await ctx.db.get(scope.id);
    if (!sub) throw new Error("Submission not found");
    const { submissionsTouched } = await recomputeForTeam(ctx, sub.teamId);
    return { submissionsTouched, teamsTouched: 1 };
  }

  if (scope.kind === "group") {
    const group = await ctx.db.get(scope.id);
    if (!group) throw new Error("Submission group not found");
    const { submissionsTouched } = await recomputeForTeam(ctx, group.teamId);
    return { submissionsTouched, teamsTouched: 1 };
  }

  if (scope.kind === "team") {
    const { submissionsTouched } = await recomputeForTeam(ctx, scope.id);
    return { submissionsTouched, teamsTouched: 1 };
  }

  // tournament scope
  const teams = await ctx.db
    .query("teams")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", scope.id))
    .collect();

  let totalSubmissions = 0;
  for (const team of teams) {
    const { submissionsTouched } = await recomputeForTeam(ctx, team._id);
    totalSubmissions += submissionsTouched;
  }
  return { submissionsTouched: totalSubmissions, teamsTouched: teams.length };
}
