import type { SystemRoleName, TournamentRoleName } from "../../common/roleData";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export class IllegalAccess extends Error {
  constructor(action: string) {
    super(`Access denied: ${action}`);
    this.name = "IllegalAccess";
  }
}

type SubmissionFacts = {
  isOwner: boolean;
  isTeamMember: boolean;
  isCaptain: boolean;
  systemRoles: SystemRoleName[];
  tournamentRoles: TournamentRoleName[];
  submissionState: "pending" | "approved" | "rejected" | "deleted";
};

export type SubmissionSubject = { submissionId: Id<"submissions"> };

export type SubmissionRule = {
  check(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: SubmissionSubject,
  ): Promise<boolean>;
  require(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: SubmissionSubject,
  ): Promise<void>;
};

// ── Private helpers ─────────────────────────────────────────────────────────

function isAdminOrDev(systemRoles: SystemRoleName[]): boolean {
  return systemRoles.includes("dev") || systemRoles.includes("admin");
}

function hasReviewerOrAbove(tournamentRoles: TournamentRoleName[]): boolean {
  return (
    tournamentRoles.includes("reviewer") ||
    tournamentRoles.includes("tournament_manager")
  );
}

async function loadSystemRoles(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<SystemRoleName[]> {
  const userRoleRows = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const roles = await Promise.all(
    userRoleRows.map((ur) => ctx.db.get(ur.roleId)),
  );

  return roles
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((r) => r.name)
    .filter(
      (name): name is SystemRoleName =>
        name === "dev" || name === "admin" || name === "organizer",
    );
}

async function loadTournamentRoles(
  ctx: QueryCtx,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
): Promise<TournamentRoleName[]> {
  const rows = await ctx.db
    .query("tournamentRoles")
    .withIndex("by_user_and_tournament", (q) =>
      q.eq("userId", userId).eq("tournamentId", tournamentId),
    )
    .collect();
  return rows.map((r) => r.role);
}

async function loadSubmissionFacts(
  ctx: QueryCtx,
  userId: Id<"users">,
  submissionId: Id<"submissions">,
): Promise<SubmissionFacts> {
  const submission = await ctx.db.get(submissionId);
  if (!submission) throw new Error("Submission not found");

  const [systemRoles, tournamentRoles, membership] = await Promise.all([
    loadSystemRoles(ctx, userId),
    loadTournamentRoles(ctx, userId, submission.tournamentId),
    ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", submission.teamId).eq("userId", userId),
      )
      .first(),
  ]);

  return {
    isOwner: submission.userId === userId,
    isTeamMember: !!membership,
    isCaptain: membership?.role === "captain",
    systemRoles,
    tournamentRoles,
    submissionState: submission.state,
  };
}

// ── Rule factory ────────────────────────────────────────────────────────────

function rule(
  name: string,
  decide: (facts: SubmissionFacts) => boolean,
): SubmissionRule {
  return {
    async check(ctx, userId, subject) {
      const facts = await loadSubmissionFacts(
        ctx,
        userId,
        subject.submissionId,
      );
      return decide(facts);
    },
    async require(ctx, userId, subject) {
      const allowed = await this.check(ctx, userId, subject);
      if (!allowed) throw new IllegalAccess(name);
    },
  };
}

// ── Submission rules ────────────────────────────────────────────────────────

export const canViewSubmission: SubmissionRule = rule(
  "canViewSubmission",
  (facts) => {
    if (isAdminOrDev(facts.systemRoles)) return true;
    if (facts.tournamentRoles.length > 0) return true;
    return facts.isOwner || facts.isTeamMember;
  },
);

export const canCreateSubmission: SubmissionRule = rule(
  "canCreateSubmission",
  (facts) => facts.isTeamMember,
);

export const canEditSubmission: SubmissionRule = rule(
  "canEditSubmission",
  (facts) => facts.isOwner && facts.submissionState === "pending",
);

export const canApproveSubmission: SubmissionRule = rule(
  "canApproveSubmission",
  (facts) => {
    if (isAdminOrDev(facts.systemRoles)) return true;
    return hasReviewerOrAbove(facts.tournamentRoles);
  },
);

export const canRejectSubmission: SubmissionRule = rule(
  "canRejectSubmission",
  (facts) => {
    if (isAdminOrDev(facts.systemRoles)) return true;
    return hasReviewerOrAbove(facts.tournamentRoles);
  },
);

export const canDeleteSubmission: SubmissionRule = rule(
  "canDeleteSubmission",
  (facts) => {
    const nonTerminal =
      facts.submissionState !== "deleted" &&
      facts.submissionState !== "rejected";
    if (isAdminOrDev(facts.systemRoles)) return nonTerminal;
    if (facts.tournamentRoles.includes("tournament_manager"))
      return nonTerminal;
    return facts.isOwner && nonTerminal;
  },
);

// ── computeSubmissionPermissions ─────────────────────────────────────────────

export async function computeSubmissionPermissions(
  ctx: QueryCtx,
  userId: Id<"users">,
  submissionId: Id<"submissions">,
): Promise<{
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
}> {
  const facts = await loadSubmissionFacts(ctx, userId, submissionId);
  const nonTerminal =
    facts.submissionState !== "deleted" && facts.submissionState !== "rejected";
  return {
    canView:
      isAdminOrDev(facts.systemRoles) ||
      facts.tournamentRoles.length > 0 ||
      facts.isOwner ||
      facts.isTeamMember,
    canCreate: facts.isTeamMember,
    canEdit: facts.isOwner && facts.submissionState === "pending",
    canApprove:
      isAdminOrDev(facts.systemRoles) ||
      hasReviewerOrAbove(facts.tournamentRoles),
    canReject:
      isAdminOrDev(facts.systemRoles) ||
      hasReviewerOrAbove(facts.tournamentRoles),
    canDelete:
      nonTerminal &&
      (isAdminOrDev(facts.systemRoles) ||
        facts.tournamentRoles.includes("tournament_manager") ||
        facts.isOwner),
  };
}

// ── Grant surface ────────────────────────────────────────────────────────────

export async function grantTournamentRole(
  ctx: MutationCtx,
  {
    userId,
    tournamentId,
    role,
  }: {
    userId: Id<"users">;
    tournamentId: Id<"tournaments">;
    role: TournamentRoleName;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("tournamentRoles")
    .withIndex("by_user_tournament_role", (q) =>
      q.eq("userId", userId).eq("tournamentId", tournamentId).eq("role", role),
    )
    .first();
  if (!existing) {
    await ctx.db.insert("tournamentRoles", { userId, tournamentId, role });
  }
}

export async function revokeTournamentRole(
  ctx: MutationCtx,
  {
    userId,
    tournamentId,
    role,
  }: {
    userId: Id<"users">;
    tournamentId: Id<"tournaments">;
    role: TournamentRoleName;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("tournamentRoles")
    .withIndex("by_user_tournament_role", (q) =>
      q.eq("userId", userId).eq("tournamentId", tournamentId).eq("role", role),
    )
    .first();
  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

// ── Global access helpers (used by non-submission queries) ───────────────────

export async function requireAdmin(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<void> {
  const systemRoles = await loadSystemRoles(ctx, userId);
  if (!isAdminOrDev(systemRoles)) throw new IllegalAccess("requireAdmin");
}

export async function hasSomeReviewAccess(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<boolean> {
  const systemRoles = await loadSystemRoles(ctx, userId);
  if (isAdminOrDev(systemRoles)) return true;
  const anyTournamentRole = await ctx.db
    .query("tournamentRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  return anyTournamentRole !== null;
}
