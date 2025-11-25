import { TeamInvitationsList } from "@/components/invitations/team-invitations-list";

/**
 * Wrapper component for TeamInvitationsList to be used in the unified dashboard
 */
export function TeamInvitationsWidget() {
  return <TeamInvitationsList pendingOnly />;
}
