import type { Id } from "../../../../convex/_generated/dataModel";
import type { TournamentWithAuthority } from "../../../../convex/tournaments";

const now = new Date();
const dayMs = 86_400_000;

function dateStr(offset: number): string {
  return new Date(now.getTime() + offset * dayMs).toISOString();
}

function makeTournament(
  id: string,
  name: string,
  description: string,
  startOffset: number,
  endOffset: number,
  teamCount: number,
  authority: TournamentWithAuthority["authority"],
): TournamentWithAuthority {
  return {
    _id: id as Id<"tournaments">,
    _creationTime: 0,
    name,
    description,
    startDate: dateStr(startOffset),
    endDate: dateStr(endOffset),
    createdBy: "user-0" as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
    teamCount,
    authority,
  };
}

function team(
  id: string,
  name: string,
  points: number,
  isCaptain: boolean,
  approved: number,
  total: number,
): NonNullable<TournamentWithAuthority["authority"]["team"]> {
  return {
    _id: id as Id<"teams">,
    name,
    points,
    isCaptain,
    approvedActivities: approved,
    totalActivities: total,
  };
}

export const SCENARIO_YOURS: TournamentWithAuthority[] = [
  makeTournament(
    "t_spring",
    "Spring Sprint 2026",
    "Push your limits with daily urban challenges. Walk, run, or explore your city — every step counts.",
    -11,
    18,
    8,
    {
      canManage: false,
      canReview: true,
      pendingReviewCount: 5,
      team: team("team-divas", "Urban Divas ✨", 320, true, 18, 24),
    },
  ),
  makeTournament(
    "t_quarter",
    "Q2 Cross-Office Cup",
    "Inter-office tournament. Earn points across individual and team exercises.",
    -26,
    2,
    12,
    {
      canManage: false,
      canReview: false,
      pendingReviewCount: 0,
      team: team("team-boold", "Booldozers", 540, false, 32, 35),
    },
  ),
  makeTournament(
    "t_kickoff",
    "Captains Kickoff",
    "A short tournament to start the season. Captains coordinate roster and warm-ups.",
    14,
    44,
    3,
    {
      canManage: true,
      canReview: true,
      pendingReviewCount: 0,
      team: team("team-legends", "Legends on Tap", 0, true, 0, 0),
    },
  ),
];

export const SCENARIO_DISCOVER: TournamentWithAuthority[] = [
  makeTournament(
    "t_summer",
    "Summer City Challenge",
    "The flagship summer tournament. Six weeks, all-office, open to every team.",
    7,
    49,
    0,
    { canManage: false, canReview: false, pendingReviewCount: 0 },
  ),
  makeTournament(
    "t_lunch",
    "Lunchtime League",
    "Lightweight midday challenge. Pick a partner, log a walk.",
    -3,
    25,
    6,
    { canManage: false, canReview: false, pendingReviewCount: 0 },
  ),
  makeTournament(
    "t_invite",
    "Invitational Trials",
    "Limited-roster invitational. Selected teams from prior tournaments.",
    21,
    60,
    4,
    { canManage: false, canReview: false, pendingReviewCount: 0 },
  ),
  makeTournament(
    "t_winter",
    "Winter Legends 2025",
    "The 2025 winter edition. Final standings on record.",
    -90,
    -20,
    14,
    { canManage: false, canReview: false, pendingReviewCount: 0 },
  ),
];

export type Scenario = {
  yours: TournamentWithAuthority[];
  discover: TournamentWithAuthority[];
};

export const FULL_SCENARIO: Scenario = {
  yours: SCENARIO_YOURS,
  discover: SCENARIO_DISCOVER,
};

export const NEWCOMER_SCENARIO: Scenario = {
  yours: [],
  discover: SCENARIO_DISCOVER,
};

export const SINGLE_TOURNAMENT_SCENARIO: Scenario = {
  yours: [SCENARIO_YOURS[0]],
  discover: [SCENARIO_DISCOVER[0], SCENARIO_DISCOVER[1]],
};

export const EMPTY_SCENARIO: Scenario = {
  yours: [],
  discover: [],
};

export type ScenarioKey = "full" | "newcomer" | "single" | "empty";

export const SCENARIOS: Record<ScenarioKey, { label: string; data: Scenario }> =
  {
    full: { label: "Veteran", data: FULL_SCENARIO },
    single: { label: "One tournament", data: SINGLE_TOURNAMENT_SCENARIO },
    newcomer: { label: "Newcomer", data: NEWCOMER_SCENARIO },
    empty: { label: "Empty", data: EMPTY_SCENARIO },
  };
