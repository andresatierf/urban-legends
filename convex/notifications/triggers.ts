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
    invitationId: Id<"joinRequests">;
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
      // actionUrl: `/teams/${params.teamId}/invitations`,
      actionMetadata: {
        invitationId: params.invitationId,
        buttons: [
          {
            label: "Accept",
            action: "accept",
            args: { invitationId: params.invitationId },
          },
          {
            label: "Decline",
            action: "reject",
            args: { invitationId: params.invitationId },
          },
        ],
      },
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
    requestId: Id<"joinRequests">;
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
      // actionUrl: `/teams/${params.teamId}/requests`,
      actionMetadata: {
        requestId: params.requestId,
        buttons: [
          {
            label: "Approve",
            action: "accept",
            args: { requestId: params.requestId },
          },
          {
            label: "Decline",
            action: "reject",
            args: { requestId: params.requestId },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to create join request notification:", error);
  }
}

export async function notifyActivityApproved(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    activityId: Id<"activities">;
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
          type: NOTIFICATION_TYPES.ACTIVITY_APPROVED,
          title: "Activity approved",
          body: `${params.description || "Your activity"} for ${params.teamName} earned ${params.pointsEarned} points`,
          relatedEntityId: params.activityId,
          relatedEntityType: "activity",
          actionUrl: `/activities/${params.activityId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create activity approved notification:", error);
  }
}

export async function notifyActivityParticipationRequested(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    activityId: Id<"activities">;
    teamName: string;
    creatorName: string;
    description?: string;
  },
) {
  try {
    await Promise.all(
      params.recipientIds.map((userId) =>
        ctx.scheduler.runAfter(0, internal.notifications.create, {
          userId,
          type: NOTIFICATION_TYPES.ACTIVITY_PARTICIPATION_REQUESTED,
          title: `${params.creatorName} needs your proof for a team activity`,
          body: `${params.description || "An activity"} for ${params.teamName} — upload your evidence`,
          relatedEntityId: params.activityId,
          relatedEntityType: "activity",
          actionUrl: `/activities/${params.activityId}`,
        }),
      ),
    );
  } catch (error) {
    console.error(
      "Failed to create activity participation-requested notification:",
      error,
    );
  }
}

export async function notifyActivityRejected(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    activityId: Id<"activities">;
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
          type: NOTIFICATION_TYPES.ACTIVITY_REJECTED,
          title: "Activity rejected",
          body:
            `${params.description || "Your activity"} for ${params.teamName} was not approved` +
            (params.reason ? `: ${params.reason}` : ""),
          relatedEntityId: params.activityId,
          relatedEntityType: "activity",
          actionUrl: `/activities/${params.activityId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create activity rejected notification:", error);
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
      // actionUrl: `/teams/${params.teamId}`,
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
          // actionUrl: `/teams/${params.teamId}`,
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
      // actionUrl: "/dashboard",
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
      // actionUrl: "/dashboard",
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
          // actionUrl: `/tournaments/${params.tournamentId}`,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to create tournament winner notification:", error);
  }
}
