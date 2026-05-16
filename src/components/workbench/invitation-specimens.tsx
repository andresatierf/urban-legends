import { InvitationCard } from "@/components/invitations/card/layout";
import { SectionHeader } from "@/components/section-header";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { VariantMatrix } from "./shells/variant-matrix";

const noop = () => {};

const RECIPIENT: Doc<"users"> = {
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
type Scenario =
  | "team-invitation-sender"
  | "team-invitation-recipient"
  | "join-request-recipient";

const STATUSES: readonly Status[] = [
  "pending",
  "accepted",
  "rejected",
  "expired",
] as const;

const SCENARIOS: readonly Scenario[] = [
  "team-invitation-sender",
  "team-invitation-recipient",
  "join-request-recipient",
] as const;

const SCENARIO_LABEL: Record<Scenario, string> = {
  "team-invitation-sender": "Captain · sent invite",
  "team-invitation-recipient": "Player · received invite",
  "join-request-recipient": "Captain · received request",
};

function baseInvitation(
  status: Status,
  initiator: "team" | "user",
  key: string,
) {
  return {
    _id: `inv-${key}` as Id<"joinRequests">,
    _creationTime: 0,
    teamId: TEAM._id,
    userId: RECIPIENT._id,
    status: status === "expired" ? ("pending" as const) : status,
    createdAt: NOW,
    respondedAt:
      status === "accepted" || status === "rejected" ? NOW : undefined,
    respondedBy:
      status === "accepted" || status === "rejected"
        ? (INVITER._id as Id<"users">)
        : undefined,
    initiator,
    createdBy: initiator === "team" ? INVITER._id : RECIPIENT._id,
    expiresAt: status === "expired" ? PAST : FUTURE,
  };
}

export function InvitationSpecimens() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="Invitations"
        description="A single InvitationCard renders both sides of a team invitation. The viewer prop swaps copy and actions while the visual identity stays the same across perspectives and statuses."
      />

      <VariantMatrix
        variants={STATUSES}
        columns={SCENARIOS}
        columnLabel={(s) => SCENARIO_LABEL[s]}
        renderCell={(status, scenario) => {
          const key = `${scenario}-${status}`;
          if (scenario === "team-invitation-sender") {
            const inv = baseInvitation(status, "team", key);
            return (
              <InvitationCard
                invitation={{
                  ...inv,
                  counterparty: RECIPIENT,
                  invitedByUser: INVITER,
                }}
                viewer="team"
                onReject={noop}
                canRespond
              />
            );
          }
          if (scenario === "team-invitation-recipient") {
            const inv = baseInvitation(status, "team", key);
            return (
              <InvitationCard
                invitation={{
                  ...inv,
                  counterparty: null,
                  team: TEAM,
                  tournament: TOURNAMENT,
                  invitedByUser: INVITER,
                }}
                viewer="user"
                onAccept={noop}
                onReject={noop}
              />
            );
          }
          const inv = {
            ...baseInvitation(status, "user", key),
            message:
              status === "pending"
                ? "I'd love to join — I've been running 5k three times a week."
                : undefined,
          };
          return (
            <InvitationCard
              invitation={{ ...inv, counterparty: RECIPIENT }}
              viewer="team"
              onAccept={noop}
              onReject={noop}
            />
          );
        }}
      />
    </section>
  );
}
