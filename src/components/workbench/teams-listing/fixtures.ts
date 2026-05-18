import type {
  TeamWithMembers,
  TournamentMap,
} from "@/components/teams/listing/types";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { DEMO_TEAM_ITEMS } from "../team-card/fixtures";

const now = new Date();
const dayMs = 86_400_000;
function dateStr(offset: number): string {
  return new Date(now.getTime() + offset * dayMs).toISOString().slice(0, 10);
}

function makeTournament(
  id: string,
  name: string,
  startOffset: number,
  endOffset: number,
): Doc<"tournaments"> {
  return {
    _id: id as Id<"tournaments">,
    _creationTime: 0,
    name,
    description:
      "Workplace fitness tournament — log daily activity for points.",
    startDate: dateStr(startOffset),
    endDate: dateStr(endOffset),
    createdBy: "user-0" as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
  };
}

export const SCENARIO_TOURNAMENTS: Doc<"tournaments">[] = [
  makeTournament("t_spring", "Spring Sprint 2026", -11, 18),
  makeTournament("t_quarter", "Q2 Cross-Office Cup", -26, 2),
  makeTournament("t_winter", "Winter Legends 2025", -90, -20),
];

export const SCENARIO_TOURNAMENT_MAP: TournamentMap =
  SCENARIO_TOURNAMENTS.reduce((acc, t) => {
    acc[t._id] = t;
    return acc;
  }, {} as TournamentMap);

// Build teams from the demo matrix, retag to the scenario tournaments so all
// three Spring/Q2/Winter buckets get teams.
const TOURNAMENT_ROTATION = [
  SCENARIO_TOURNAMENTS[0]._id,
  SCENARIO_TOURNAMENTS[0]._id,
  SCENARIO_TOURNAMENTS[0]._id,
  SCENARIO_TOURNAMENTS[1]._id,
  SCENARIO_TOURNAMENTS[1]._id,
  SCENARIO_TOURNAMENTS[1]._id,
  SCENARIO_TOURNAMENTS[2]._id,
  SCENARIO_TOURNAMENTS[2]._id,
  SCENARIO_TOURNAMENTS[2]._id,
];

const SCENARIO_TEAM_NAMES = [
  "Urban Divas ✨",
  "Booldozers",
  "Sedentários em Revolução",
  "404 Shape Not Found",
  "Legends on Tap",
  "Step Monsters",
  "Cardio Criminals",
  "Pavement Pounders",
  "Walk of Shame",
];

const VIEWER_USER_ID = "user-viewer" as Id<"users">;

const SCENARIO_ITEMS = DEMO_TEAM_ITEMS.slice(0, 9).map((item, idx) => {
  const tournamentId = TOURNAMENT_ROTATION[idx];
  const renamedMembers = item.members.map((m, mi) => ({
    ...m,
    _id: mi === 0 && item.isUserMember ? (VIEWER_USER_ID as string) : m._id,
  }));
  return {
    ...item,
    team: {
      ...item.team,
      name: SCENARIO_TEAM_NAMES[idx],
      tournamentId,
    },
    members: renamedMembers,
  };
});

// Build TeamWithMembers shape (the type used by the real listing component).
function toTeamWithMembers(
  item: (typeof SCENARIO_ITEMS)[number],
): TeamWithMembers {
  return {
    ...item.team,
    members: item.members.map((m) => ({
      _id: m._id as Id<"users">,
      _creationTime: 0,
      name: m.name,
      email: `${m.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      externalId: `ext-${m._id}`,
      imageUrl: undefined,
      memberRole: m.memberRole,
    })) as unknown as TeamWithMembers["members"],
    rank: item.rank,
    totalTeams: item.totalTeams,
  } as TeamWithMembers;
}

export const SCENARIO_ALL_TEAMS: TeamWithMembers[] =
  SCENARIO_ITEMS.map(toTeamWithMembers);

export const SCENARIO_USER_TEAMS: TeamWithMembers[] = SCENARIO_ITEMS.filter(
  (it) => it.isUserMember,
).map(toTeamWithMembers);

export const SCENARIO_USER_ID = VIEWER_USER_ID;

export const SCENARIO_USER_TEAM_IDS = new Set(
  SCENARIO_USER_TEAMS.map((t) => t._id),
);
export const SCENARIO_USER_TOURNAMENT_IDS = new Set(
  SCENARIO_USER_TEAMS.map((t) => t.tournamentId),
);
