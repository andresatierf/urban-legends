// Notification type constants for type safety
export const NOTIFICATION_TYPES = {
  // Team Events (10 types)
  TEAM_INVITATION_RECEIVED: "team_invitation_received",
  TEAM_JOIN_REQUEST_RECEIVED: "team_join_request_received",
  JOIN_REQUEST_APPROVED: "join_request_approved",
  JOIN_REQUEST_REJECTED: "join_request_rejected",
  MEMBER_JOINED_TEAM: "member_joined_team",
  MEMBER_LEFT_TEAM: "member_left_team",
  REMOVED_FROM_TEAM: "removed_from_team",
  CAPTAIN_ROLE_TRANSFERRED_TO: "captain_role_transferred_to",
  CAPTAIN_ROLE_TRANSFERRED_FROM: "captain_role_transferred_from",
  TEAM_DELETED: "team_deleted",

  // Submission Events (4 types)
  SUBMISSION_APPROVED: "submission_approved",
  SUBMISSION_REJECTED: "submission_rejected",
  SUBMISSION_GROUP_AUTO_CREATED: "submission_group_auto_created",
  TEAMMATE_SUBMITTED: "teammate_submitted",

  // Tournament Events (5 types)
  TOURNAMENT_STARTING_24H: "tournament_starting_24h",
  TOURNAMENT_STARTED: "tournament_started",
  TOURNAMENT_ENDING_24H: "tournament_ending_24h",
  TOURNAMENT_ENDED: "tournament_ended",
  TOURNAMENT_WINNER_ANNOUNCED: "tournament_winner_announced",

  // Role/Admin Events (3 types)
  ROLE_GRANTED: "role_granted",
  ROLE_REVOKED: "role_revoked",
  PENDING_ITEMS_DIGEST: "pending_items_digest",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export type RelatedEntityType =
  | "team"
  | "submission"
  | "tournament"
  | "role"
  | "user"
  | "submissionGroup";

export const VALID_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPES);

export function isValidNotificationType(type: string): boolean {
  return VALID_NOTIFICATION_TYPES.includes(type as NotificationType);
}
