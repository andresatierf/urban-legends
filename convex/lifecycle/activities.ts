import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { claimUploads, releaseUploads } from "../evidenceStorage";
import { nowUTC, toUTCDateString } from "../lib/dates";
import { recomputeRecentActivity } from "./submissions";

export class IllegalTransition extends Error {
  constructor(from: string, to: string) {
    super(`Illegal state transition: ${from} → ${to}`);
    this.name = "IllegalTransition";
  }
}

export type ActivityState =
  | "incomplete"
  | "pending"
  | "approved"
  | "rejected"
  | "deleted";

export type ScoringConfig = {
  individualPoints: { base: number; advanced: number };
  teamExercisePoints: { base: number; advanced: number };
  teamExerciseThreshold: number;
};

// Per ADR-0001: score() stays a single private helper, one strategy.
export function score(
  scoringConfig: ScoringConfig,
  tier: "base" | "advanced",
  isTeamExercise: boolean,
): number {
  return isTeamExercise
    ? scoringConfig.teamExercisePoints[tier]
    : scoringConfig.individualPoints[tier];
}

async function updateTeamPoints(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<void> {
  const approved = await ctx.db
    .query("activities")
    .withIndex("by_team_and_state", (q) =>
      q.eq("teamId", teamId).eq("state", "approved"),
    )
    .collect();
  const total = approved.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
  await ctx.db.patch(teamId, { points: total, lastActivityAt: nowUTC() });
  await recomputeRecentActivity(ctx, teamId);
}

// Creates an individual Activity. The creator provides Evidence (1–5 images);
// the Activity lands directly in `pending` (individual completeness = 1/1).
export async function create(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    date: string;
    tier?: "base" | "advanced";
    description?: string;
    evidenceStorageIds: Id<"_storage">[];
  },
): Promise<Id<"activities">> {
  if (args.evidenceStorageIds.length === 0) {
    throw new Error("An Activity requires at least 1 Evidence image");
  }
  if (args.evidenceStorageIds.length > 5) {
    throw new Error("An Activity allows a maximum 5 Evidence images");
  }

  const team = await ctx.db.get(args.teamId);
  if (!team) throw new Error("Team not found");

  const tournament = await ctx.db.get(team.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", args.teamId).eq("userId", args.userId),
    )
    .first();
  if (!membership) throw new Error("You are not a member of this team");

  const date = toUTCDateString(args.date);

  // Cap distinct Activities per (team, date) per ADR-0009.
  const cap = tournament.maxSubmissionsPerDay;
  if (cap) {
    const existing = await ctx.db
      .query("activities")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", date),
      )
      .collect();
    const active = existing.filter((a) => a.state !== "deleted");
    if (active.length >= cap) {
      throw new Error(
        `Daily activity limit reached (${cap} per day). The team has already recorded ${active.length} activity(ies) today.`,
      );
    }
  }

  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  const totalTeamMembers = teamMembers.length;
  const participantCount = 1;
  const participationRate =
    totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
  const isTeamExercise =
    participationRate >= tournament.scoringConfig.teamExerciseThreshold;
  const tier = args.tier ?? "base";
  const now = nowUTC();

  const activityId = await ctx.db.insert("activities", {
    teamId: args.teamId,
    tournamentId: team.tournamentId,
    createdBy: args.userId,
    date,
    type: "individual",
    description: args.description,
    tier,
    state: "pending",
    pointsEarned: 0,
    participantCount,
    totalTeamMembers,
    participationRate,
    isTeamExercise,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("participations", {
    activityId,
    userId: args.userId,
    teamId: args.teamId,
    tournamentId: team.tournamentId,
    evidenceStorageIds: args.evidenceStorageIds,
    fulfilledAt: now,
    pointsEarned: 0,
    createdAt: now,
  });

  await claimUploads(ctx, args.userId, args.evidenceStorageIds);

  await recomputeRecentActivity(ctx, args.teamId);

  return activityId;
}

// Approves a pending Activity. Idempotent; throws IllegalTransition for
// terminal source states. Scores per ADR-0001.
export async function approve(
  ctx: MutationCtx,
  activityId: Id<"activities">,
  by: Id<"users">,
): Promise<{ pointsDelta: number; state: ActivityState }> {
  const activity = await ctx.db.get(activityId);
  if (!activity) throw new Error("Activity not found");

  if (activity.state === "approved") {
    return { pointsDelta: 0, state: "approved" };
  }
  if (
    activity.state === "rejected" ||
    activity.state === "deleted" ||
    activity.state === "incomplete"
  ) {
    throw new IllegalTransition(activity.state, "approved");
  }

  const oldTeamPoints = (await ctx.db.get(activity.teamId))?.points ?? 0;
  const tournament = await ctx.db.get(activity.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const pts = score(
    tournament.scoringConfig,
    activity.tier,
    activity.isTeamExercise,
  );

  await ctx.db.patch(activityId, {
    state: "approved",
    pointsEarned: pts,
    managedBy: by,
    reviewedAt: Date.now(),
    updatedAt: nowUTC(),
  });

  // Distribute points across fulfilled participations.
  const parts = await ctx.db
    .query("participations")
    .withIndex("by_activity", (q) => q.eq("activityId", activityId))
    .collect();
  const fulfilled = parts.filter((p) => p.fulfilledAt);
  const perPart = fulfilled.length > 0 ? pts / fulfilled.length : 0;
  for (const p of fulfilled) {
    await ctx.db.patch(p._id, { pointsEarned: perPart });
  }

  await updateTeamPoints(ctx, activity.teamId);
  const newTeamPoints = (await ctx.db.get(activity.teamId))?.points ?? 0;
  return { pointsDelta: newTeamPoints - oldTeamPoints, state: "approved" };
}

// Rejects an Activity with required reason. Idempotent on already-rejected;
// throws IllegalTransition for deleted source state.
export async function reject(
  ctx: MutationCtx,
  activityId: Id<"activities">,
  by: Id<"users">,
  options: { rejectionReason: string },
): Promise<{ pointsDelta: number; state: ActivityState }> {
  const reason = options.rejectionReason.trim();
  if (reason.length === 0) {
    throw new Error("Rejection reason is required");
  }

  const activity = await ctx.db.get(activityId);
  if (!activity) throw new Error("Activity not found");

  if (activity.state === "rejected") {
    return { pointsDelta: 0, state: "rejected" };
  }
  if (activity.state === "deleted") {
    throw new IllegalTransition("deleted", "rejected");
  }
  if (activity.state === "approved") {
    // ADR-0009: reject reopens and clears the score.
  }

  const oldTeamPoints = (await ctx.db.get(activity.teamId))?.points ?? 0;

  await ctx.db.patch(activityId, {
    state: "rejected",
    pointsEarned: 0,
    managedBy: by,
    reviewedAt: Date.now(),
    rejectionReason: reason,
    updatedAt: nowUTC(),
  });

  const parts = await ctx.db
    .query("participations")
    .withIndex("by_activity", (q) => q.eq("activityId", activityId))
    .collect();
  for (const p of parts) {
    await ctx.db.patch(p._id, { pointsEarned: 0 });
  }

  await updateTeamPoints(ctx, activity.teamId);
  const newTeamPoints = (await ctx.db.get(activity.teamId))?.points ?? 0;
  return { pointsDelta: newTeamPoints - oldTeamPoints, state: "rejected" };
}

// Edits a non-terminal Activity's description, tier, or date. Also lets the
// creator update the Evidence on their own Participation.
export async function edit(
  ctx: MutationCtx,
  activityId: Id<"activities">,
  patch: {
    date?: string;
    tier?: "base" | "advanced";
    description?: string;
    evidenceStorageIds?: Id<"_storage">[];
  },
  by: Id<"users">,
): Promise<void> {
  const activity = await ctx.db.get(activityId);
  if (!activity) throw new Error("Activity not found");

  if (activity.state === "approved" || activity.state === "rejected") {
    throw new IllegalTransition(activity.state, "pending");
  }
  if (activity.state === "deleted") {
    throw new IllegalTransition("deleted", "pending");
  }

  if (patch.evidenceStorageIds !== undefined) {
    const newIds = patch.evidenceStorageIds;
    if (newIds.length === 0) {
      throw new Error("An Activity requires at least 1 Evidence image");
    }
    if (newIds.length > 5) {
      throw new Error("An Activity allows a maximum 5 Evidence images");
    }
    const part = await ctx.db
      .query("participations")
      .withIndex("by_activity_and_user", (q) =>
        q.eq("activityId", activityId).eq("userId", by),
      )
      .first();
    if (!part) throw new Error("Participation not found for editor");
    const currentIds = part.evidenceStorageIds ?? [];
    const added = newIds.filter((id) => !currentIds.includes(id));
    const removed = currentIds.filter((id) => !newIds.includes(id));
    if (added.length > 0) await claimUploads(ctx, by, added);
    if (removed.length > 0) await releaseUploads(ctx, removed);
    await ctx.db.patch(part._id, {
      evidenceStorageIds: newIds,
      fulfilledAt: nowUTC(),
    });
  }

  const newDate = patch.date ? toUTCDateString(patch.date) : activity.date;

  await ctx.db.patch(activityId, {
    ...(patch.date !== undefined && { date: newDate }),
    ...(patch.tier !== undefined && { tier: patch.tier }),
    ...(patch.description !== undefined && { description: patch.description }),
    updatedAt: nowUTC(),
  });

  await recomputeRecentActivity(ctx, activity.teamId);
}

// Soft-deletes an Activity from any non-terminal state, releasing evidence.
export async function softDelete(
  ctx: MutationCtx,
  activityId: Id<"activities">,
  by: Id<"users">,
): Promise<{ pointsDelta: number }> {
  const activity = await ctx.db.get(activityId);
  if (!activity) throw new Error("Activity not found");

  if (activity.state === "deleted") {
    return { pointsDelta: 0 };
  }
  if (activity.state === "rejected") {
    throw new IllegalTransition("rejected", "deleted");
  }

  const oldTeamPoints = (await ctx.db.get(activity.teamId))?.points ?? 0;

  const parts = await ctx.db
    .query("participations")
    .withIndex("by_activity", (q) => q.eq("activityId", activityId))
    .collect();
  for (const p of parts) {
    await releaseUploads(ctx, p.evidenceStorageIds ?? []);
    await ctx.db.patch(p._id, { evidenceStorageIds: [], pointsEarned: 0 });
  }

  await ctx.db.patch(activityId, {
    state: "deleted",
    pointsEarned: 0,
    managedBy: by,
    updatedAt: nowUTC(),
  });

  await updateTeamPoints(ctx, activity.teamId);
  const newTeamPoints = (await ctx.db.get(activity.teamId))?.points ?? 0;
  return { pointsDelta: newTeamPoints - oldTeamPoints };
}

// Recomputes pointsEarned for the given scope, then reconciles team.points.
// Never changes state. Idempotent.
async function recomputeForTeam(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<{ activitiesTouched: number }> {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");
  const tournament = await ctx.db.get(team.tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  const sc = tournament.scoringConfig;

  const activities = await ctx.db
    .query("activities")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  let touched = 0;
  for (const a of activities) {
    const pts =
      a.state === "approved" ? score(sc, a.tier, a.isTeamExercise) : 0;
    await ctx.db.patch(a._id, { pointsEarned: pts });
    const parts = await ctx.db
      .query("participations")
      .withIndex("by_activity", (q) => q.eq("activityId", a._id))
      .collect();
    const fulfilled = parts.filter((p) => p.fulfilledAt);
    const perPart = fulfilled.length > 0 ? pts / fulfilled.length : 0;
    for (const p of parts) {
      await ctx.db.patch(p._id, {
        pointsEarned: fulfilled.some((f) => f._id === p._id) ? perPart : 0,
      });
    }
    touched++;
  }

  await updateTeamPoints(ctx, teamId);
  return { activitiesTouched: touched };
}

export async function recompute(
  ctx: MutationCtx,
  scope:
    | { kind: "activity"; id: Id<"activities"> }
    | { kind: "team"; id: Id<"teams"> }
    | { kind: "tournament"; id: Id<"tournaments"> },
  _by: Id<"users">,
): Promise<{ activitiesTouched: number; teamsTouched: number }> {
  if (scope.kind === "activity") {
    const a = await ctx.db.get(scope.id);
    if (!a) throw new Error("Activity not found");
    const { activitiesTouched } = await recomputeForTeam(ctx, a.teamId);
    return { activitiesTouched, teamsTouched: 1 };
  }
  if (scope.kind === "team") {
    const { activitiesTouched } = await recomputeForTeam(ctx, scope.id);
    return { activitiesTouched, teamsTouched: 1 };
  }
  const teams = await ctx.db
    .query("teams")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", scope.id))
    .collect();
  let total = 0;
  for (const t of teams) {
    const { activitiesTouched } = await recomputeForTeam(ctx, t._id);
    total += activitiesTouched;
  }
  return { activitiesTouched: total, teamsTouched: teams.length };
}
