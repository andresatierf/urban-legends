import type { SystemRoleName, TournamentRoleName } from "../../common/roleData";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export class IllegalAccess extends Error {
  constructor(action: string) {
    super(`Access denied: ${action}`);
    this.name = "IllegalAccess";
  }
}

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

// ── Activity rules ──────────────────────────────────────────────────────────

type ActivityFacts = {
  isCreator: boolean;
  isTeamMember: boolean;
  isCaptain: boolean;
  isDeclaredParticipant: boolean;
  systemRoles: SystemRoleName[];
  tournamentRoles: TournamentRoleName[];
  activityState: "incomplete" | "pending" | "approved" | "rejected" | "deleted";
  activityType: "individual" | "group";
};

export type ActivitySubject = { activityId: Id<"activities"> };

export type ActivityRule = {
  check(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: ActivitySubject,
  ): Promise<boolean>;
  require(
    ctx: QueryCtx,
    userId: Id<"users">,
    subject: ActivitySubject,
  ): Promise<void>;
};

async function loadActivityFacts(
  ctx: QueryCtx,
  userId: Id<"users">,
  activityId: Id<"activities">,
): Promise<ActivityFacts> {
  const activity = await ctx.db.get(activityId);
  if (!activity) throw new Error("Activity not found");

  const [systemRoles, tournamentRoles, membership, participation] =
    await Promise.all([
      loadSystemRoles(ctx, userId),
      loadTournamentRoles(ctx, userId, activity.tournamentId),
      ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", activity.teamId).eq("userId", userId),
        )
        .first(),
      ctx.db
        .query("participations")
        .withIndex("by_activity_and_user", (q) =>
          q.eq("activityId", activityId).eq("userId", userId),
        )
        .first(),
    ]);

  return {
    isCreator: activity.createdBy === userId,
    isTeamMember: !!membership,
    isCaptain: membership?.role === "captain",
    isDeclaredParticipant: !!participation,
    systemRoles,
    tournamentRoles,
    activityState: activity.state,
    activityType: activity.type,
  };
}

function activityRule(
  name: string,
  decide: (facts: ActivityFacts) => boolean,
): ActivityRule {
  return {
    async check(ctx, userId, subject) {
      const facts = await loadActivityFacts(ctx, userId, subject.activityId);
      return decide(facts);
    },
    async require(ctx, userId, subject) {
      const allowed = await this.check(ctx, userId, subject);
      if (!allowed) throw new IllegalAccess(name);
    },
  };
}

export const canViewActivity: ActivityRule = activityRule(
  "canViewActivity",
  (facts) => {
    if (isAdminOrDev(facts.systemRoles)) return true;
    if (facts.tournamentRoles.length > 0) return true;
    return facts.isCreator || facts.isTeamMember;
  },
);

// canCreateActivity uses TeamSubject: user must be a member of the team.
export const canCreateActivity: TeamRule = teamRule(
  "canCreateActivity",
  (facts) => facts.isMember,
);

export const canEditActivity: ActivityRule = activityRule(
  "canEditActivity",
  (facts) =>
    facts.isCreator &&
    (facts.activityState === "pending" ||
      facts.activityState === "incomplete" ||
      facts.activityState === "rejected"),
);

export const canApproveActivity: ActivityRule = activityRule(
  "canApproveActivity",
  (facts) => {
    if (facts.activityState !== "pending") return false;
    if (isAdminOrDev(facts.systemRoles)) return true;
    return hasReviewerOrAbove(facts.tournamentRoles);
  },
);

// canRejectActivity also allows reject from `approved` (reject-to-reopen, ADR-0009):
// an approved Activity is immutable except via reject, which clears the score.
export const canRejectActivity: ActivityRule = activityRule(
  "canRejectActivity",
  (facts) => {
    if (facts.activityState !== "pending" && facts.activityState !== "approved")
      return false;
    if (isAdminOrDev(facts.systemRoles)) return true;
    return hasReviewerOrAbove(facts.tournamentRoles);
  },
);

export const canSubmitEvidence: ActivityRule = activityRule(
  "canSubmitEvidence",
  (facts) =>
    facts.isDeclaredParticipant &&
    (facts.activityState === "incomplete" || facts.activityState === "pending"),
);

export const canRemoveParticipant: ActivityRule = activityRule(
  "canRemoveParticipant",
  (facts) => {
    if (facts.activityType !== "group") return false;
    if (
      facts.activityState !== "incomplete" &&
      facts.activityState !== "pending"
    )
      return false;
    if (isAdminOrDev(facts.systemRoles)) return true;
    if (facts.tournamentRoles.includes("tournament_manager")) return true;
    return facts.isCreator || facts.isCaptain;
  },
);

export const canDeleteActivity: ActivityRule = activityRule(
  "canDeleteActivity",
  (facts) => {
    const nonTerminal =
      facts.activityState !== "deleted" &&
      facts.activityState !== "rejected" &&
      facts.activityState !== "approved";
    if (isAdminOrDev(facts.systemRoles)) return nonTerminal;
    if (facts.tournamentRoles.includes("tournament_manager"))
      return nonTerminal;
    return facts.isCreator && nonTerminal;
  },
);

export async function computeActivityPermissions(
  ctx: QueryCtx,
  userId: Id<"users">,
  activityId: Id<"activities">,
): Promise<{
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
  canSubmitEvidence: boolean;
  canRemoveParticipant: boolean;
}> {
  const facts = await loadActivityFacts(ctx, userId, activityId);
  const isAdmin = isAdminOrDev(facts.systemRoles);
  const isReviewer = hasReviewerOrAbove(facts.tournamentRoles);
  const isManager = facts.tournamentRoles.includes("tournament_manager");
  const nonTerminalDeletable =
    facts.activityState !== "deleted" &&
    facts.activityState !== "rejected" &&
    facts.activityState !== "approved";
  const rosterEditable =
    facts.activityType === "group" &&
    (facts.activityState === "incomplete" || facts.activityState === "pending");
  return {
    canView:
      isAdmin ||
      facts.tournamentRoles.length > 0 ||
      facts.isCreator ||
      facts.isTeamMember,
    canEdit:
      facts.isCreator &&
      (facts.activityState === "pending" ||
        facts.activityState === "incomplete" ||
        facts.activityState === "rejected"),
    canApprove: facts.activityState === "pending" && (isAdmin || isReviewer),
    canReject:
      (facts.activityState === "pending" ||
        facts.activityState === "approved") &&
      (isAdmin || isReviewer),
    canDelete:
      nonTerminalDeletable && (isAdmin || isManager || facts.isCreator),
    canSubmitEvidence:
      facts.isDeclaredParticipant &&
      (facts.activityState === "incomplete" ||
        facts.activityState === "pending"),
    canRemoveParticipant:
      rosterEditable &&
      (isAdmin || isManager || facts.isCreator || facts.isCaptain),
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

// ── Global access helpers ────────────────────────────────────────────────────

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
  (facts) =>
    (isAdminOrDev(facts.systemRoles) ||
      facts.tournamentRoles.includes("tournament_manager") ||
      facts.isCaptain) &&
    facts.memberCount > 1,
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

// ── Challenge rules ─────────────────────────────────────────────────────────

// canManageChallenge grants create/edit/list on Challenges within a Tournament.
// Subject is TournamentSubject: for create the caller passes the target
// tournament directly; for edit/etc. the caller loads the Challenge first and
// passes its tournamentId.
export const canManageChallenge: TournamentRule = tournamentRule(
  "canManageChallenge",
  (facts) =>
    isAdminOrDev(facts.systemRoles) ||
    facts.tournamentRoles.includes("tournament_manager"),
);

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

// canCancelJoinRequest: mirrors accept/reject branching.
// User-direction → only the requester (who is also the creator) may cancel.
// Team-direction → captain/admin/tournament_manager may cancel the invitation.
export const canCancelJoinRequest: JoinRequestRule = joinRequestRule(
  "canCancelJoinRequest",
  (facts) => {
    if (facts.initiator === "user") return facts.isCreator;
    return (
      isAdminOrDev(facts.systemRoles) ||
      facts.tournamentRoles.includes("tournament_manager") ||
      facts.isCaptain
    );
  },
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
    canTransferCaptaincy:
      (isPrivileged || facts.isCaptain) && facts.memberCount > 1,
    canManageMembers: isPrivileged || facts.isCaptain,
  };
}
