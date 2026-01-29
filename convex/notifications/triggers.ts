import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { NOTIFICATION_TYPES } from "./types";

/**
 * Helper function to create team invitation notification
 */
export async function notifyTeamInvitation(
  ctx: MutationCtx,
  params: {
    invitedUserId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
    inviterName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.invitedUserId,
      type: NOTIFICATION_TYPES.TEAM_INVITATION_RECEIVED,
      title: `You've been invited to join ${params.teamName}`,
      body: `${params.inviterName} invited you to join their team`,
      relatedEntityId: params.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${params.teamId}/invitations`,
    });
  } catch (error) {
    console.error("Failed to create team invitation notification:", error);
  }
}

/**
 * Helper function to create join request notification
 */
export async function notifyJoinRequest(
  ctx: MutationCtx,
  params: {
    captainId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
    requesterName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.captainId,
      type: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_RECEIVED,
      title: `${params.requesterName} wants to join ${params.teamName}`,
      body: "Review and respond to the join request",
      relatedEntityId: params.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${params.teamId}/requests`,
    });
  } catch (error) {
    console.error("Failed to create join request notification:", error);
  }
}

/**
 * Helper function to create submission approved notification
 */
export async function notifySubmissionApproved(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    submissionId: Id<"submissions">;
    teamName: string;
    description?: string;
    pointsEarned: number;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.SUBMISSION_APPROVED,
          title: "Submission approved",
          body: `${params.description || "Your submission"} for ${params.teamName} earned ${params.pointsEarned} points`,
          relatedEntityId: params.submissionId,
          relatedEntityType: "submission",
          actionUrl: `/submissions/${params.submissionId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create submission approved notification:", error);
  }
}

/**
 * Helper function to create submission rejected notification
 */
export async function notifySubmissionRejected(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    submissionId: Id<"submissions">;
    teamName: string;
    description?: string;
    reason?: string;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.SUBMISSION_REJECTED,
          title: "Submission rejected",
          body:
            `${params.description || "Your submission"} for ${params.teamName} was not approved` +
            (params.reason ? `: ${params.reason}` : ""),
          relatedEntityId: params.submissionId,
          relatedEntityType: "submission",
          actionUrl: `/submissions/${params.submissionId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create submission rejected notification:", error);
  }
}

/**
 * Helper function to create teammate submitted notification
 */
export async function notifyTeammateSubmitted(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    submissionId: Id<"submissions">;
    teamId: Id<"teams">;
    submitterName: string;
    description?: string;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.TEAMMATE_SUBMITTED,
          title: `${params.submitterName} submitted an activity`,
          body: params.description || "Check out your team's progress",
          relatedEntityId: params.teamId,
          relatedEntityType: "team",
          actionUrl: `/teams/${params.teamId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create teammate submitted notification:", error);
  }
}

/**
 * Helper function to create join request approved notification
 */
export async function notifyJoinRequestApproved(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.userId,
      type: NOTIFICATION_TYPES.JOIN_REQUEST_APPROVED,
      title: `Your request to join ${params.teamName} was approved`,
      body: "Welcome to the team!",
      relatedEntityId: params.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${params.teamId}`,
    });
  } catch (error) {
    console.error(
      "Failed to create join request approved notification:",
      error,
    );
  }
}

/**
 * Helper function to create join request rejected notification
 */
export async function notifyJoinRequestRejected(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.userId,
      type: NOTIFICATION_TYPES.JOIN_REQUEST_REJECTED,
      title: `Your request to join ${params.teamName} was declined`,
      body: "You can try joining other teams",
      relatedEntityId: params.teamId,
      relatedEntityType: "team",
      actionUrl: `/tournaments`,
    });
  } catch (error) {
    console.error(
      "Failed to create join request rejected notification:",
      error,
    );
  }
}

/**
 * Helper function to create member joined notification
 */
export async function notifyMemberJoined(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    teamId: Id<"teams">;
    teamName: string;
    newMemberName: string;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.MEMBER_JOINED_TEAM,
          title: `${params.newMemberName} joined ${params.teamName}`,
          body: "Your team is getting stronger!",
          relatedEntityId: params.teamId,
          relatedEntityType: "team",
          actionUrl: `/teams/${params.teamId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create member joined notification:", error);
  }
}

/**
 * Helper function to create removed from team notification
 */
export async function notifyRemovedFromTeam(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.userId,
      type: NOTIFICATION_TYPES.REMOVED_FROM_TEAM,
      title: `You were removed from ${params.teamName}`,
      body: "You are no longer a member of this team",
      relatedEntityId: params.teamId,
      relatedEntityType: "team",
      actionUrl: `/tournaments`,
    });
  } catch (error) {
    console.error("Failed to create removed from team notification:", error);
  }
}

/**
 * Helper function to create role granted notification
 */
export async function notifyRoleGranted(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    roleName: string;
    roleDisplayName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.userId,
      type: NOTIFICATION_TYPES.ROLE_GRANTED,
      title: `${params.roleDisplayName} role granted`,
      body: `You have been granted ${params.roleDisplayName} privileges`,
      relatedEntityId: params.roleName,
      relatedEntityType: "role",
      actionUrl: "/dashboard",
    });
  } catch (error) {
    console.error("Failed to create role granted notification:", error);
  }
}

/**
 * Helper function to create role revoked notification
 */
export async function notifyRoleRevoked(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    roleName: string;
    roleDisplayName: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.userId,
      type: NOTIFICATION_TYPES.ROLE_REVOKED,
      title: `${params.roleDisplayName} role revoked`,
      body: `Your ${params.roleDisplayName} privileges have been removed`,
      relatedEntityId: params.roleName,
      relatedEntityType: "role",
      actionUrl: "/dashboard",
    });
  } catch (error) {
    console.error("Failed to create role revoked notification:", error);
  }
}

/**
 * Helper function to create tournament winner announcement notification
 */
export async function notifyTournamentWinner(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    tournamentId: Id<"tournaments">;
    tournamentName: string;
    winnerTeamName: string;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.TOURNAMENT_WINNER_ANNOUNCED,
          title: `${params.tournamentName} has ended!`,
          body: `${params.winnerTeamName} won the tournament!`,
          relatedEntityId: params.tournamentId,
          relatedEntityType: "tournament",
          actionUrl: `/tournaments/${params.tournamentId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create tournament winner notification:", error);
  }
}

/**
 * Helper function to create submission flagged for review notification
 */
export async function notifySubmissionFlaggedForReview(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    submissionId: Id<"submissions">;
    teamName: string;
    flaggedBy: string;
    reason?: string;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.SUBMISSION_FLAGGED_FOR_REVIEW,
          title: "Submission flagged for review",
          body: `${params.flaggedBy} flagged a submission from ${params.teamName} for review${params.reason ? `: ${params.reason}` : ""}`,
          relatedEntityId: params.submissionId,
          relatedEntityType: "submission",
          actionUrl: `/admin/submissions?highlight=${params.submissionId}`,
        }),
      ),
    );
  } catch (error) {
    console.error(
      "Failed to create submission flagged for review notification:",
      error,
    );
  }
}

/**
 * Helper function to create tournament manager assigned notification
 */
export async function notifyTournamentManagerAssigned(
  ctx: MutationCtx,
  params: {
    managerId: Id<"users">;
    tournamentId: Id<"tournaments">;
    tournamentName: string;
    assignedBy: string;
  },
) {
  try {
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: params.managerId,
      type: NOTIFICATION_TYPES.ASSIGNED_AS_TOURNAMENT_MANAGER,
      title: `You've been assigned as tournament manager`,
      body: `${params.assignedBy} assigned you to manage ${params.tournamentName}`,
      relatedEntityId: params.tournamentId,
      relatedEntityType: "tournament",
      actionUrl: `/tournaments/${params.tournamentId}`,
    });
  } catch (error) {
    console.error(
      "Failed to create tournament manager assigned notification:",
      error,
    );
  }
}
