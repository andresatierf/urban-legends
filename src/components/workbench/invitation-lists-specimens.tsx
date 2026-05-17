import {
  InvitedUsersListView,
  JoinRequestsListView,
  type JoinRequestRow,
  TeamInvitationsListView,
} from "@/components/invitations/listing";
import { SectionHeader } from "@/components/section-header";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { VariantMatrix } from "./shells/variant-matrix";

const noop = () => {};

const VIEWER: Doc<"users"> = {
  _id: "user-viewer" as Id<"users">,
  _creationTime: 0,
  name: "Joana Machado",
  email: "joana@example.com",
  externalId: "ext-viewer",
};

const CAPTAIN: Doc<"users"> = {
  _id: "user-captain" as Id<"users">,
  _creationTime: 0,
  name: "Carlos Galvão",
  email: "carlos@example.com",
  externalId: "ext-captain",
};

const OTHER_PLAYERS: Doc<"users">[] = [
  {
    _id: "user-other-1" as Id<"users">,
    _creationTime: 0,
    name: "Inês Pereira",
    email: "ines@example.com",
    externalId: "ext-other-1",
  },
  {
    _id: "user-other-2" as Id<"users">,
    _creationTime: 0,
    name: "Tomás Costa",
    email: "tomas@example.com",
    externalId: "ext-other-2",
  },
  {
    _id: "user-other-3" as Id<"users">,
    _creationTime: 0,
    name: "Beatriz Silva",
    email: "beatriz@example.com",
    externalId: "ext-other-3",
  },
];

const TOURNAMENT: Doc<"tournaments"> = {
  _id: "tournament-demo" as Id<"tournaments">,
  _creationTime: 0,
  name: "Urban Legends 2026",
  description: "Push your limits with daily urban challenges.",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  createdBy: CAPTAIN._id,
  scoringConfig: {
    individualPoints: { base: 10, advanced: 30 },
    teamExercisePoints: { base: 20, advanced: 50 },
    teamExerciseThreshold: 0.5,
  },
};

const TEAM: Doc<"teams"> = {
  _id: "team-demo" as Id<"teams">,
  _creationTime: 0,
  name: "Urban Divas ✨",
  tournamentId: TOURNAMENT._id,
  createdBy: CAPTAIN._id,
  joinPolicy: "open",
  points: 320,
};

const NOW = new Date(Date.now() - 3 * 86_400_000).toISOString();
const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();

type View = "invited-users" | "join-requests" | "team-invitations";
type Scenario = "empty" | "loading" | "one" | "several";

const VIEWS: readonly View[] = [
  "invited-users",
  "join-requests",
  "team-invitations",
] as const;

const SCENARIOS: readonly Scenario[] = [
  "empty",
  "loading",
  "one",
  "several",
] as const;

const VIEW_LABEL: Record<View, string> = {
  "invited-users": "Captain · invited users",
  "join-requests": "Captain · join requests",
  "team-invitations": "Player · received invitations",
};

const SCENARIO_LABEL: Record<Scenario, string> = {
  empty: "Empty",
  loading: "Loading",
  one: "1 row",
  several: "N rows",
};

function teamInitiatedRow(
  user: Doc<"users">,
  idSuffix: string,
): JoinRequestRow {
  return {
    _id: `inv-team-${idSuffix}` as Id<"joinRequests">,
    _creationTime: 0,
    teamId: TEAM._id,
    userId: user._id,
    status: "pending",
    createdAt: NOW,
    initiator: "team",
    createdBy: CAPTAIN._id,
    expiresAt: FUTURE,
    user,
    team: { ...TEAM, tournament: TOURNAMENT },
    tournament: TOURNAMENT,
    invitedByUser: CAPTAIN,
  };
}

function userInitiatedRow(
  user: Doc<"users">,
  idSuffix: string,
  message?: string,
): JoinRequestRow {
  return {
    _id: `req-user-${idSuffix}` as Id<"joinRequests">,
    _creationTime: 0,
    teamId: TEAM._id,
    userId: user._id,
    status: "pending",
    createdAt: NOW,
    initiator: "user",
    createdBy: user._id,
    expiresAt: FUTURE,
    message,
    user,
    team: { ...TEAM, tournament: TOURNAMENT },
    tournament: TOURNAMENT,
    invitedByUser: null,
  };
}

function rowsFor(view: View, scenario: Scenario): JoinRequestRow[] | undefined {
  if (scenario === "loading") return undefined;
  if (scenario === "empty") return [];

  const players =
    scenario === "one" ? OTHER_PLAYERS.slice(0, 1) : OTHER_PLAYERS;

  if (view === "invited-users") {
    return players.map((u, i) => teamInitiatedRow(u, `${view}-${i}`));
  }
  if (view === "join-requests") {
    return players.map((u, i) =>
      userInitiatedRow(
        u,
        `${view}-${i}`,
        i === 0
          ? "I'd love to join — I've been running 5k three times a week."
          : undefined,
      ),
    );
  }
  return players.map((_, i) => teamInitiatedRow(VIEWER, `${view}-${i}`));
}

function renderView(view: View, rows: JoinRequestRow[] | undefined) {
  if (view === "invited-users") {
    return (
      <InvitedUsersListView
        invitations={rows}
        processingId={null}
        onCancel={noop}
        canCancel
      />
    );
  }
  if (view === "join-requests") {
    return (
      <JoinRequestsListView
        requests={rows}
        processingId={null}
        onAccept={noop}
        onReject={noop}
        canRespond
      />
    );
  }
  return (
    <TeamInvitationsListView
      invitations={rows}
      processingId={null}
      onAccept={noop}
      onReject={noop}
    />
  );
}

export function InvitationListsSpecimens() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="Invitation Lists"
        description="Presentational *View components for the three invitation list containers. Each pairs a JoinRequestRow[] feed with action callbacks; the wrapping containers own the Convex queries and mutations."
      />

      <VariantMatrix
        variants={SCENARIOS}
        columns={VIEWS}
        variantLabel={(s) => SCENARIO_LABEL[s]}
        columnLabel={(v) => VIEW_LABEL[v]}
        renderCell={(scenario, view) =>
          renderView(view, rowsFor(view, scenario))
        }
      />
    </section>
  );
}
