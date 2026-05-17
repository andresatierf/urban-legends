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

// Returns all rows for (teamId, userId) pair; used for lockout and duplicate checks.
async function existingForPair(
  ctx: MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
) {
  const all = await ctx.db.query("joinRequests").collect();
  return all.filter((r) => r.teamId === teamId && r.userId === userId);
}

// Creates a User-direction join request.
// Caller is responsible for the join-policy check (open vs closed team).
// This function enforces the lockout (rejected row blocks re-request) and duplicate-pending guard.
// Capacity and tournament-uniqueness are deferred to accept (pre-accept invariants).
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
// No rejection lockout on this direction: a captain may invite a previously
// rejected user, since the prior rejection may have been a mistake. The
// user-direction `request` path remains locked out by a prior rejection so a
// rejected user cannot pester the team.
// Capacity and tournament-uniqueness are deferred to accept (pre-accept invariants).
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
// Enforces pre-accept capacity (CONTEXT rule 3) and uniqueness (CONTEXT rule 4):
// rejects if accepting would exceed the Team's size cap, or if the User is already
// a TeamMember in another Team of the same Tournament.
// Inserts a TeamMember row and cascades sibling pending rows in the same Tournament.
// Caller is responsible for authority checks.
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

  const team = await ctx.db.get(req.teamId);
  if (!team) throw new Error("Team not found");

  const currentMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", req.teamId))
    .collect();

  if (team.maxMembers && currentMembers.length >= team.maxMembers) {
    throw new Error("Team is full");
  }

  const userTeams = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", req.userId))
    .collect();

  if (userTeams.length > 0) {
    const otherTeamIds = new Set(userTeams.map((m) => m.teamId));
    const tournamentTeams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", team.tournamentId),
      )
      .collect();
    const conflict = tournamentTeams.find((t) => otherTeamIds.has(t._id));
    if (conflict) {
      throw new Error(
        "User is already a member of another team in this tournament",
      );
    }
  }

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

  await cascade(ctx, {
    userId: req.userId,
    tournamentId: team.tournamentId,
    excludeRequestId: requestId,
  });
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
export async function cancel(
  ctx: MutationCtx,
  requestId: Id<"joinRequests">,
  by: Id<"users">,
): Promise<void> {
  const req = await ctx.db.get(requestId);
  if (!req) throw new Error("Join request not found");
  if (req.status !== "pending")
    throw new IllegalTransition(req.status, "cancelled");

  await ctx.db.patch(requestId, {
    status: "cancelled",
    respondedAt: nowUTC(),
    respondedBy: by,
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
