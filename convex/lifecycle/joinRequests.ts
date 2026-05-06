import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { nowUTC } from "../lib/dates";

export class IllegalTransition extends Error {
  constructor(from: string, to: string) {
    super(`Illegal state transition: ${from} → ${to}`);
    this.name = "IllegalTransition";
  }
}

// Cancels sibling pending rows for the same User in the same Tournament.
// Uses JS-side filtering to stay compatible with convex-test@0.0.1.
async function cascade(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    tournamentId: Id<"tournaments">;
    excludeRequestId: Id<"joinRequests">;
  },
): Promise<void> {
  const allTeams = await ctx.db
    .query("teams")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
    .collect();

  const teamIds = new Set(allTeams.map((t) => t._id));

  const byUser = await ctx.db
    .query("joinRequests")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .collect();

  const now = nowUTC();
  for (const req of byUser) {
    if (req._id === args.excludeRequestId) continue;
    if (req.status !== "pending") continue;
    if (!teamIds.has(req.teamId)) continue;
    await ctx.db.patch(req._id, { status: "cancelled", respondedAt: now });
  }
}

// Returns all rows for (teamId, userId) pair — used for lockout and duplicate checks.
async function existingForPair(
  ctx: MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
) {
  const all = await ctx.db.query("joinRequests").collect();
  return all.filter((r) => r.teamId === teamId && r.userId === userId);
}

// Creates a User-direction join request.
// Caller is responsible for checking team capacity, visibility, and tournament membership.
// This function enforces the lockout (rejected row blocks re-request) and duplicate-pending guard.
export async function request(
  ctx: MutationCtx,
  args: {
    teamId: Id<"teams">;
    userId: Id<"users">;
    message?: string;
  },
): Promise<Id<"joinRequests">> {
  const existing = await existingForPair(ctx, args.teamId, args.userId);

  if (existing.some((r) => r.status === "rejected")) {
    throw new Error(
      "Your join request was rejected. You cannot request to join this team again",
    );
  }

  if (existing.some((r) => r.status === "pending")) {
    throw new Error("You already have a pending join request for this team");
  }

  const now = nowUTC();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7);

  return ctx.db.insert("joinRequests", {
    teamId: args.teamId,
    userId: args.userId,
    status: "pending",
    message: args.message,
    createdAt: now,
    initiator: "user",
    createdBy: args.userId,
    expiresAt: expiresAt.toISOString(),
  });
}

// Creates a Team-direction join request (invitation).
// Symmetric lockout: a rejected row for (user, team) blocks re-invite.
// Caller is responsible for checking team capacity and tournament membership.
export async function invite(
  ctx: MutationCtx,
  args: {
    teamId: Id<"teams">;
    userId: Id<"users">;
    createdBy: Id<"users">;
    message?: string;
  },
): Promise<Id<"joinRequests">> {
  const existing = await existingForPair(ctx, args.teamId, args.userId);

  if (existing.some((r) => r.status === "rejected")) {
    throw new Error(
      "This user cannot be invited — they were previously rejected from this team",
    );
  }

  if (existing.some((r) => r.status === "pending")) {
    throw new Error(
      "This user already has a pending request or invitation for this team",
    );
  }

  const now = nowUTC();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7);

  return ctx.db.insert("joinRequests", {
    teamId: args.teamId,
    userId: args.userId,
    status: "pending",
    message: args.message,
    createdAt: now,
    initiator: "team",
    createdBy: args.createdBy,
    expiresAt: expiresAt.toISOString(),
  });
}

// Accepts a pending join request (pending → accepted).
// Lazily expires if past expiresAt before proceeding.
// Inserts a TeamMember row and cascades sibling pending rows in the same Tournament.
// Caller is responsible for authority checks and validating team capacity / tournament membership.
export async function accept(
  ctx: MutationCtx,
  requestId: Id<"joinRequests">,
  by: Id<"users">,
): Promise<void> {
  const req = await ctx.db.get(requestId);
  if (!req) throw new Error("Join request not found");

  if (req.expiresAt && new Date() > new Date(req.expiresAt)) {
    await ctx.db.patch(requestId, {
      status: "expired",
      respondedAt: new Date().toISOString(),
    });
    throw new Error("Join request has expired");
  }

  if (req.status !== "pending")
    throw new IllegalTransition(req.status, "accepted");

  await ctx.db.insert("teamMembers", {
    teamId: req.teamId,
    userId: req.userId,
    role: "member",
  });

  await ctx.db.patch(requestId, {
    status: "accepted",
    respondedAt: nowUTC(),
    respondedBy: by,
  });

  const team = await ctx.db.get(req.teamId);
  if (team) {
    await cascade(ctx, {
      userId: req.userId,
      tournamentId: team.tournamentId,
      excludeRequestId: requestId,
    });
  }
}

// Rejects a pending join request (pending → rejected).
// The rejected status engages the lockout for the (User, Team) pair.
export async function reject(
  ctx: MutationCtx,
  requestId: Id<"joinRequests">,
  by: Id<"users">,
): Promise<void> {
  const req = await ctx.db.get(requestId);
  if (!req) throw new Error("Join request not found");
  if (req.status !== "pending")
    throw new IllegalTransition(req.status, "rejected");

  await ctx.db.patch(requestId, {
    status: "rejected",
    respondedAt: nowUTC(),
    respondedBy: by,
  });
}

// Cancels a pending join request (pending → cancelled).
// Only the creator (createdBy) may cancel.
export async function cancel(
  ctx: MutationCtx,
  requestId: Id<"joinRequests">,
  by: Id<"users">,
): Promise<void> {
  const req = await ctx.db.get(requestId);
  if (!req) throw new Error("Join request not found");
  if (req.status !== "pending")
    throw new IllegalTransition(req.status, "cancelled");

  const owner = req.createdBy;
  if (owner !== by) {
    throw new Error("Only the creator can cancel this join request");
  }

  await ctx.db.patch(requestId, {
    status: "cancelled",
    respondedAt: nowUTC(),
  });
}

// Lazily transitions pending → expired if past expiresAt.
// Returns "noop" if the row is not pending or within the expiry window.
export async function expire(
  ctx: MutationCtx,
  requestId: Id<"joinRequests">,
): Promise<"noop" | "expired"> {
  const req = await ctx.db.get(requestId);
  if (!req) throw new Error("Join request not found");
  if (req.status !== "pending") return "noop";

  const now = new Date();
  if (now <= new Date(req.expiresAt)) return "noop";

  await ctx.db.patch(requestId, {
    status: "expired",
    respondedAt: now.toISOString(),
  });
  return "expired";
}
