import { InvitedUserCard } from "@/components/invitations/invited-user-card";
import { JoinRequestCard } from "@/components/invitations/join-request-card";
import { TeamInvitationCard } from "@/components/invitations/team-invitation-card";
import { SectionHeader } from "@/components/section-header";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { VariantMatrix } from "./shells/variant-matrix";

const noop = () => {};

const SHARED_USER: Doc<"users"> = {
  _id: "user-recipient" as Id<"users">,
  _creationTime: 0,
  name: "Joana Machado",
  email: "joana@example.com",
  externalId: "ext-recipient",
};

const INVITER: Doc<"users"> = {
  _id: "user-inviter" as Id<"users">,
  _creationTime: 0,
  name: "Carlos Galvão",
  email: "carlos@example.com",
  externalId: "ext-inviter",
};

const TEAM: Doc<"teams"> = {
  _id: "team-demo" as Id<"teams">,
  _creationTime: 0,
  name: "Urban Divas ✨",
  tournamentId: "tournament-demo" as Id<"tournaments">,
  createdBy: INVITER._id,
  joinPolicy: "open",
  points: 320,
};

const TOURNAMENT: Doc<"tournaments"> = {
  _id: "tournament-demo" as Id<"tournaments">,
  _creationTime: 0,
  name: "Urban Legends 2026",
  description: "Push your limits with daily urban challenges.",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  createdBy: INVITER._id,
  scoringConfig: {
    individualPoints: { base: 10, advanced: 30 },
    teamExercisePoints: { base: 20, advanced: 50 },
    teamExerciseThreshold: 0.5,
  },
};

const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 7 * 86_400_000).toISOString();
const NOW = new Date(Date.now() - 3 * 86_400_000).toISOString();

type Status = "pending" | "accepted" | "rejected" | "expired";
type CardKind = "invited-user" | "join-request" | "team-invitation";

const STATUSES: readonly Status[] = [
  "pending",
  "accepted",
  "rejected",
  "expired",
] as const;

const CARDS: readonly CardKind[] = [
  "invited-user",
  "join-request",
  "team-invitation",
] as const;

const CARD_LABEL: Record<CardKind, string> = {
  "invited-user": "InvitedUserCard",
  "join-request": "JoinRequestCard",
  "team-invitation": "TeamInvitationCard",
};

function baseInvitation(status: Status, key: string) {
  return {
    _id: `inv-${key}` as Id<"joinRequests">,
    _creationTime: 0,
    teamId: TEAM._id,
    userId: SHARED_USER._id,
    status: status === "expired" ? "pending" : status,
    createdAt: NOW,
    respondedAt:
      status === "accepted" || status === "rejected" ? NOW : undefined,
    respondedBy:
      status === "accepted" || status === "rejected"
        ? (INVITER._id as Id<"users">)
        : undefined,
    initiator: "team" as const,
    createdBy: INVITER._id,
    expiresAt: status === "expired" ? PAST : FUTURE,
  };
}

export function InvitationSpecimens() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="Invitations"
        description="The three invitation card variants — captain-facing (InvitedUserCard), captain-facing inbound (JoinRequestCard), and player-facing (TeamInvitationCard) — across the pending/accepted/rejected/expired status axis."
      />

      <VariantMatrix
        variants={STATUSES}
        columns={CARDS}
        columnLabel={(c) => CARD_LABEL[c]}
        renderCell={(status, card) => {
          const key = `${card}-${status}`;
          const inv = baseInvitation(status, key);
          if (card === "invited-user") {
            return (
              <InvitedUserCard
                invitation={{
                  ...inv,
                  invitedUser: SHARED_USER,
                  invitedByUser: INVITER,
                }}
                processing={false}
                onClick={noop}
                canCancel={status === "pending"}
              />
            );
          }
          if (card === "join-request") {
            return (
              <JoinRequestCard
                request={{
                  ...inv,
                  user: SHARED_USER,
                  message:
                    status === "pending"
                      ? "I'd love to join — I've been running 5k three times a week."
                      : undefined,
                }}
                processing={false}
                onApprove={noop}
                onReject={noop}
              />
            );
          }
          return (
            <TeamInvitationCard
              invitation={{
                ...inv,
                team: TEAM,
                tournament: TOURNAMENT,
                invitedByUser: INVITER,
              }}
              processing={false}
              onAccept={noop}
              onReject={noop}
            />
          );
        }}
      />
    </section>
  );
}
