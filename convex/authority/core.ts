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
    if (facts.submissionState !== "pending") return false;
    if (isAdminOrDev(facts.systemRoles)) return true;
    return hasReviewerOrAbove(facts.tournamentRoles);
  },
);

export const canRejectSubmission: SubmissionRule = rule(
  "canRejectSubmission",
  (facts) => {
    if (facts.submissionState !== "pending") return false;
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
      facts.submissionState === "pending" &&
      (isAdminOrDev(facts.systemRoles) ||
        hasReviewerOrAbove(facts.tournamentRoles)),
    canReject:
      facts.submissionState === "pending" &&
      (isAdminOrDev(facts.systemRoles) ||
        hasReviewerOrAbove(facts.tournamentRoles)),
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

export async function isGlobalAdminOrDev(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<boolean> {
  const systemRoles = await loadSystemRoles(ctx, userId);
  return isAdminOrDev(systemRoles);
}

export async function hasSomeTournamentManagerAccess(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<boolean> {
  const systemRoles = await loadSystemRoles(ctx, userId);
  if (isAdminOrDev(systemRoles)) return true;
  const anyManagerRole = await ctx.db
    .query("tournamentRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "tournament_manager"))
    .first();
  return anyManagerRole !== null;
}

// ── Team rules ───────────────────────────────────────────────────────────────

type TeamFacts = {
  isCaptain: boolean;
  isMember: boolean;
  systemRoles: SystemRoleName[];
  tournamentRoles: TournamentRoleName[];
  memberCount: number;
};

export type TeamSubject = { teamId: Id<"teams"> };

export type TeamRule = {
  check(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: TeamSubject,
  ): Promise<boolean>;
  require(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: TeamSubject,
  ): Promise<void>;
};

async function loadTeamFacts(
  ctx: QueryCtx,
  userId: Id<"users">,
  teamId: Id<"teams">,
): Promise<TeamFacts> {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");

  const [systemRoles, tournamentRoles, membership, members] = await Promise.all(
    [
      loadSystemRoles(ctx, userId),
      loadTournamentRoles(ctx, userId, team.tournamentId),
      ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", teamId).eq("userId", userId),
        )
        .first(),
      ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect(),
    ],
  );

  return {
    isCaptain: membership?.role === "captain",
    isMember: !!membership,
    systemRoles,
    tournamentRoles,
    memberCount: members.length,
  };
}

function teamRule(
  name: string,
  decide: (facts: TeamFacts) => boolean,
): TeamRule {
  return {
    async check(ctx, userId, subject) {
      const facts = await loadTeamFacts(ctx, userId, subject.teamId);
      return decide(facts);
    },
    async require(ctx, userId, subject) {
      const allowed = await this.check(ctx, userId, subject);
      if (!allowed) throw new IllegalAccess(name);
    },
  };
}

export const canViewTeam: TeamRule = teamRule("canViewTeam", () => true);

export const canEditTeam: TeamRule = teamRule(
  "canEditTeam",
  (facts) =>
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager") ||
    facts.isCaptain,
);

export const canDeleteTeam: TeamRule = teamRule(
  "canDeleteTeam",
  (facts) =>
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager") ||
    facts.isCaptain,
);

export const canInviteToTeam: TeamRule = teamRule(
  "canInviteToTeam",
  (facts) =>
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager") ||
    facts.isCaptain,
);

export const canLeaveTeam: TeamRule = teamRule("canLeaveTeam", (facts) => {
  if (!facts.isMember) return false;
  if (!facts.isCaptain) return true;
  return facts.memberCount === 1;
});

export const canTransferCaptaincy: TeamRule = teamRule(
  "canTransferCaptaincy",
  (facts) => facts.isCaptain && facts.memberCount > 1,
);

export const canManageTeamMembers: TeamRule = teamRule(
  "canManageTeamMembers",
  (facts) =>
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager") ||
    facts.isCaptain,
);

// ── Tournament rules ─────────────────────────────────────────────────────────

type TournamentFacts = {
  systemRoles: SystemRoleName[];
  tournamentRoles: TournamentRoleName[];
};

export type TournamentSubject = { tournamentId: Id<"tournaments"> };

export type TournamentRule = {
  check(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: TournamentSubject,
  ): Promise<boolean>;
  require(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: TournamentSubject,
  ): Promise<void>;
};

async function loadTournamentFacts(
  ctx: QueryCtx,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
): Promise<TournamentFacts> {
  const [systemRoles, tournamentRoles] = await Promise.all([
    loadSystemRoles(ctx, userId),
    loadTournamentRoles(ctx, userId, tournamentId),
  ]);
  return { systemRoles, tournamentRoles };
}

function tournamentRule(
  name: string,
  decide: (facts: TournamentFacts) => boolean,
): TournamentRule {
  return {
    async check(ctx, userId, subject) {
      const facts = await loadTournamentFacts(
        ctx,
        userId,
        subject.tournamentId,
      );
      return decide(facts);
    },
    async require(ctx, userId, subject) {
      const allowed = await this.check(ctx, userId, subject);
      if (!allowed) throw new IllegalAccess(name);
    },
  };
}

export const canViewTournament: TournamentRule = tournamentRule(
  "canViewTournament",
  () => true,
);

export const canEditTournament: TournamentRule = tournamentRule(
  "canEditTournament",
  (facts) =>
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager"),
);

export const canDeleteTournament: TournamentRule = tournamentRule(
  "canDeleteTournament",
  (facts) => isAdminOrDev(facts.systemRoles),
);

export const canGrantTournamentRole: TournamentRule = tournamentRule(
  "canGrantTournamentRole",
  (facts) => isAdminOrDev(facts.systemRoles),
);

export const canRevokeTournamentRole: TournamentRule = tournamentRule(
  "canRevokeTournamentRole",
  (facts) => isAdminOrDev(facts.systemRoles),
);

// canCreateTournament has no tournament context (create time), so it stands alone.
export const canCreateTournament = {
  async check(ctx: QueryCtx, userId: Id<"users">): Promise<boolean> {
    const systemRoles = await loadSystemRoles(ctx, userId);
    return isAdminOrDev(systemRoles) || systemRoles.includes("organizer");
  },
  async require(ctx: QueryCtx, userId: Id<"users">): Promise<void> {
    const allowed = await this.check(ctx, userId);
    if (!allowed) throw new IllegalAccess("canCreateTournament");
  },
};

export async function onTournamentCreated(
  ctx: MutationCtx,
  {
    tournamentId,
    creatorId,
  }: { tournamentId: Id<"tournaments">; creatorId: Id<"users"> },
): Promise<void> {
  await grantTournamentRole(ctx, {
    userId: creatorId,
    tournamentId,
    role: "tournament_manager",
  });
}

// ── computeTournamentPermissions ─────────────────────────────────────────────

export async function computeTournamentPermissions(
  ctx: QueryCtx,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
): Promise<{
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canGrantRole: boolean;
  canRevokeRole: boolean;
}> {
  const facts = await loadTournamentFacts(ctx, userId, tournamentId);
  const isAdmin = isAdminOrDev(facts.systemRoles);
  return {
    canView: true,
    canEdit: isAdmin || facts.tournamentRoles.includes("tournament_manager"),
    canDelete: isAdmin,
    canGrantRole: isAdmin,
    canRevokeRole: isAdmin,
  };
}

// ── Join request rules ────────────────────────────────────────────────────────

type JoinRequestFacts = {
  isRequester: boolean;
  isCreator: boolean;
  initiator: "user" | "team" | undefined;
  isCaptain: boolean;
  systemRoles: SystemRoleName[];
  tournamentRoles: TournamentRoleName[];
};

export type JoinRequestSubject = { requestId: Id<"joinRequests"> };

export type JoinRequestRule = {
  check(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: JoinRequestSubject,
  ): Promise<boolean>;
  require(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: JoinRequestSubject,
  ): Promise<void>;
};

async function loadJoinRequestFacts(
  ctx: QueryCtx,
  userId: Id<"users">,
  requestId: Id<"joinRequests">,
): Promise<JoinRequestFacts> {
  const request = await ctx.db.get(requestId);
  if (!request) throw new Error("Join request not found");

  const team = await ctx.db.get(request.teamId);
  if (!team) throw new Error("Team not found");

  const [systemRoles, tournamentRoles, membership] = await Promise.all([
    loadSystemRoles(ctx, userId),
    loadTournamentRoles(ctx, userId, team.tournamentId),
    ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", request.teamId).eq("userId", userId),
      )
      .first(),
  ]);

  return {
    isRequester: request.userId === userId,
    isCreator: (request.createdBy ?? request.userId) === userId,
    initiator: request.initiator,
    isCaptain: membership?.role === "captain",
    systemRoles,
    tournamentRoles,
  };
}

function joinRequestRule(
  name: string,
  decide: (facts: JoinRequestFacts) => boolean,
): JoinRequestRule {
  return {
    async check(ctx, userId, subject) {
      const facts = await loadJoinRequestFacts(ctx, userId, subject.requestId);
      return decide(facts);
    },
    async require(ctx, userId, subject) {
      const allowed = await this.check(ctx, userId, subject);
      if (!allowed) throw new IllegalAccess(name);
    },
  };
}

// canCancelJoinRequest: only the original creator may cancel.
// For user-direction, createdBy === userId (the requester).
// For team-direction, createdBy === the inviting captain.
export const canCancelJoinRequest: JoinRequestRule = joinRequestRule(
  "canCancelJoinRequest",
  (facts) => facts.isCreator,
);

// canAcceptJoinRequest: branches on initiator.
// User-direction → captain/admin/tournament_manager may accept.
// Team-direction → only the prospect (userId) may accept.
export const canAcceptJoinRequest: JoinRequestRule = joinRequestRule(
  "canAcceptJoinRequest",
  (facts) => {
    if (facts.initiator === "team") return facts.isRequester;
    return (
      isAdminOrDev(facts.systemRoles) ||
      facts.tournamentRoles.includes("tournament_manager") ||
      facts.isCaptain
    );
  },
);

// canRejectJoinRequest: mirrors canAcceptJoinRequest branching.
// User-direction → captain/admin/tournament_manager may reject.
// Team-direction → only the prospect (userId) may reject.
export const canRejectJoinRequest: JoinRequestRule = joinRequestRule(
  "canRejectJoinRequest",
  (facts) => {
    if (facts.initiator === "team") return facts.isRequester;
    return (
      isAdminOrDev(facts.systemRoles) ||
      facts.tournamentRoles.includes("tournament_manager") ||
      facts.isCaptain
    );
  },
);

// canCreateJoinRequest reuses TeamSubject: user must not already be a member.
export const canCreateJoinRequest: TeamRule = teamRule(
  "canCreateJoinRequest",
  (facts) => !facts.isMember,
);

// ── computeTeamPermissions ───────────────────────────────────────────────────

export async function computeTeamPermissions(
  ctx: QueryCtx,
  userId: Id<"users">,
  teamId: Id<"teams">,
): Promise<{
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canLeave: boolean;
  canTransferCaptaincy: boolean;
  canManageMembers: boolean;
}> {
  const facts = await loadTeamFacts(ctx, userId, teamId);
  const isPrivileged =
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager");
  return {
    canView: true,
    canEdit: isPrivileged || facts.isCaptain,
    canDelete: isPrivileged || facts.isCaptain,
    canInvite: isPrivileged || facts.isCaptain,
    canLeave: facts.isMember && (!facts.isCaptain || facts.memberCount === 1),
    canTransferCaptaincy: facts.isCaptain && facts.memberCount > 1,
    canManageMembers: isPrivileged || facts.isCaptain,
  };
}
