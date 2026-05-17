import type {
  JoinTeamRequestState,
  TeamCardData,
} from "@/components/teams/card";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export type JoinButtonState =
  | "open-idle"
  | "open-pending"
  | "team-invitation"
  | "closed"
  | "full"
  | "member"
  | "signed-out";

export const JOIN_BUTTON_STATES: readonly JoinButtonState[] = [
  "open-idle",
  "open-pending",
  "team-invitation",
  "closed",
  "full",
  "member",
  "signed-out",
] as const;

export const JOIN_BUTTON_STATE_LABELS: Record<JoinButtonState, string> = {
  "open-idle": "Open · idle",
  "open-pending": "Open · pending request",
  "team-invitation": "Team-initiated invitation",
  closed: "Closed to invitations",
  full: "Full",
  member: "Already a member",
  "signed-out": "Signed-out viewer",
};

export const JOIN_BUTTON_STATE_DESCRIPTIONS: Record<JoinButtonState, string> = {
  "open-idle": "Open team an outsider can request to join.",
  "open-pending":
    "Outsider has a pending request; the card shows a Cancel control.",
  "team-invitation":
    "Captain invited the viewer; the card shows Accept and Reject controls.",
  closed: "Captain-only invitations; outsiders see a disabled badge.",
  full: "Roster cap reached; outsiders see a disabled badge.",
  member: "Viewer is already on the team, so no action renders.",
  "signed-out":
    "Anonymous viewer (no Convex query); behaves like idle since the container skips the request lookup.",
};

type FixtureEntry = {
  data: TeamCardData;
  joinRequest: JoinTeamRequestState;
};

function makeTeam(overrides: Partial<Doc<"teams">>): Doc<"teams"> {
  return {
    _id: "demo-team" as Id<"teams">,
    _creationTime: 0,
    name: "Urban Divas ✨",
    tournamentId: "demo-tournament" as Id<"tournaments">,
    createdBy: "demo-user" as Id<"users">,
    joinPolicy: "open",
    maxMembers: 8,
    points: 0,
    ...overrides,
  };
}

const BASE_DATA: TeamCardData = {
  team: makeTeam({}),
  members: [],
  memberCount: 4,
  isUserMember: false,
  isUserInTeam: false,
  userRole: null,
};

export const JOIN_BUTTON_FIXTURES: Record<JoinButtonState, FixtureEntry> = {
  "open-idle": {
    data: BASE_DATA,
    joinRequest: null,
  },
  "open-pending": {
    data: BASE_DATA,
    joinRequest: { _id: "demo-request", initiator: "user" },
  },
  "team-invitation": {
    data: BASE_DATA,
    joinRequest: { _id: "demo-invitation", initiator: "team" },
  },
  closed: {
    data: {
      ...BASE_DATA,
      team: makeTeam({ joinPolicy: "closed" }),
    },
    joinRequest: null,
  },
  full: {
    data: {
      ...BASE_DATA,
      team: makeTeam({ maxMembers: 4 }),
      memberCount: 4,
    },
    joinRequest: null,
  },
  member: {
    data: {
      ...BASE_DATA,
      isUserMember: true,
      isUserInTeam: true,
      userRole: "member",
    },
    joinRequest: null,
  },
  "signed-out": {
    data: BASE_DATA,
    joinRequest: null,
  },
};

export const JOIN_TEAM_CARD_VARIANTS = [
  {
    id: "global-first",
    label: "Global · first team",
    description: "Rendered on the teams hub when the user has no teams at all.",
    props: { first: true } as const,
  },
  {
    id: "global-list",
    label: "Global · alongside list",
    description: "Rendered on the teams hub when other teams already exist.",
    props: {} as const,
  },
] as const;
