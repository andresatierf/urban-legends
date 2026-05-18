import type {
  DashboardStandingsTimeline,
  DashboardTeam,
  DashboardTournament,
} from "./legacy-types";

const id = <T>(s: string) => s as unknown as T;

const todayMs = Date.now();
const dayMs = 86_400_000;
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type MockTournamentState = "active" | "urgent" | "ended" | "upcoming";

type MockTournament = DashboardTournament & {
  __state: MockTournamentState;
};

const buildTournament = (overrides: {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  state: MockTournamentState;
  maxSubmissionsPerDay?: number;
}): MockTournament => ({
  _id: id<DashboardTournament["_id"]>(overrides._id),
  _creationTime: todayMs - 40 * dayMs,
  name: overrides.name,
  description: "Workplace tournament — log daily activity for points.",
  startDate: overrides.startDate,
  endDate: overrides.endDate,
  teamMinSize: 3,
  teamMaxSize: 8,
  createdBy: id<DashboardTournament["createdBy"]>("user_org"),
  scoringConfig: {
    individualPoints: { base: 5, advanced: 10 },
    teamExercisePoints: { base: 8, advanced: 14 },
    teamExerciseThreshold: 3,
  },
  maxSubmissionsPerDay: overrides.maxSubmissionsPerDay,
  __state: overrides.state,
});

export const MOCK_TOURNAMENTS: MockTournament[] = [
  buildTournament({
    _id: "t_spring",
    name: "Spring Sprint 2026",
    startDate: isoDate(todayMs - 11 * dayMs),
    endDate: isoDate(todayMs + 18 * dayMs),
    state: "active",
    maxSubmissionsPerDay: 2,
  }),
  buildTournament({
    _id: "t_quarter",
    name: "Q2 Cross-Office",
    startDate: isoDate(todayMs - 26 * dayMs),
    endDate: isoDate(todayMs + 2 * dayMs),
    state: "urgent",
    maxSubmissionsPerDay: 1,
  }),
  buildTournament({
    _id: "t_winter",
    name: "Winter Classic",
    startDate: isoDate(todayMs - 40 * dayMs),
    endDate: isoDate(todayMs - 3 * dayMs),
    state: "ended",
    maxSubmissionsPerDay: 1,
  }),
];

const teamRow = (
  tournament: MockTournament,
  team: {
    id: string;
    name: string;
    points: number;
    members: number;
    role: "captain" | "member" | "rival";
  },
): DashboardTeam => ({
  team: {
    _id: id<DashboardTeam["team"]["_id"]>(team.id),
    _creationTime: todayMs - 30 * dayMs,
    name: team.name,
    tournamentId: tournament._id,
    createdBy: id<DashboardTournament["createdBy"]>("user_org"),
    joinPolicy: "open",
    maxMembers: 8,
    points: team.points,
  },
  tournament,
  memberCount: team.members,
  userRole: team.role,
});

const SPRING_TEAMS = [
  {
    id: "tm_spring_codepit",
    name: "Codepit Crew",
    points: 84,
    members: 6,
    role: "rival" as const,
  },
  {
    id: "tm_spring_pixel",
    name: "Pixel Pacers",
    points: 76,
    members: 7,
    role: "rival" as const,
  },
  {
    id: "tm_spring_legends",
    name: "Urban Legends",
    points: 71,
    members: 5,
    role: "captain" as const,
  },
  {
    id: "tm_spring_404",
    name: "404 Not Found",
    points: 58,
    members: 4,
    role: "rival" as const,
  },
  {
    id: "tm_spring_kernel",
    name: "Kernel Panic",
    points: 49,
    members: 6,
    role: "rival" as const,
  },
  {
    id: "tm_spring_byte",
    name: "Bytecode Brigade",
    points: 32,
    members: 4,
    role: "rival" as const,
  },
];

const QUARTER_TEAMS = [
  {
    id: "tm_q_north",
    name: "North Atrium",
    points: 188,
    members: 8,
    role: "rival" as const,
  },
  {
    id: "tm_q_legends",
    name: "Urban Legends",
    points: 184,
    members: 7,
    role: "member" as const,
  },
  {
    id: "tm_q_south",
    name: "South Mezzanine",
    points: 162,
    members: 8,
    role: "rival" as const,
  },
  {
    id: "tm_q_field",
    name: "Field Office",
    points: 154,
    members: 5,
    role: "rival" as const,
  },
];

const WINTER_TEAMS = [
  {
    id: "tm_w_legends",
    name: "Urban Legends",
    points: 412,
    members: 6,
    role: "member" as const,
  },
  {
    id: "tm_w_silver",
    name: "Silver Streaks",
    points: 388,
    members: 7,
    role: "rival" as const,
  },
  {
    id: "tm_w_bronze",
    name: "Bronze Boulevard",
    points: 351,
    members: 6,
    role: "rival" as const,
  },
  {
    id: "tm_w_iron",
    name: "Iron Lanes",
    points: 296,
    members: 5,
    role: "rival" as const,
  },
];

const MOCK_TEAM_ROWS: DashboardTeam[] = [
  ...SPRING_TEAMS.map((t) => teamRow(MOCK_TOURNAMENTS[0], t)),
  ...QUARTER_TEAMS.map((t) => teamRow(MOCK_TOURNAMENTS[1], t)),
  ...WINTER_TEAMS.map((t) => teamRow(MOCK_TOURNAMENTS[2], t)),
];

export const MOCK_TEAMS_BY_TOURNAMENT: Record<string, DashboardTeam[]> = {
  [MOCK_TOURNAMENTS[0]._id]: MOCK_TEAM_ROWS.slice(0, 6),
  [MOCK_TOURNAMENTS[1]._id]: MOCK_TEAM_ROWS.slice(6, 10),
  [MOCK_TOURNAMENTS[2]._id]: MOCK_TEAM_ROWS.slice(10, 14),
};

function buildTimelines(
  teams: DashboardTeam[],
  tournament: MockTournament,
): DashboardStandingsTimeline[] {
  const startMs = new Date(tournament.startDate).getTime();
  const endMs = Math.min(new Date(tournament.endDate).getTime(), todayMs);
  const span = Math.max(endMs - startMs, dayMs);

  return teams.map((row, teamIdx) => {
    const finalPts = row.team.points;
    const eventCount = Math.max(6, Math.min(14, Math.round(finalPts / 8)));
    const events = Array.from({ length: eventCount }, (_, i) => {
      const t = startMs + ((i + 1) / (eventCount + 1)) * span;
      const wiggle = ((teamIdx + i) % 3) - 1;
      const base = Math.round(finalPts / eventCount) + wiggle;
      return {
        timestamp: t,
        points: Math.max(base, 1),
      };
    });
    const actual = events.reduce((sum, e) => sum + e.points, 0);
    const drift = finalPts - actual;
    if (events.length > 0) events[events.length - 1].points += drift;
    return { teamId: row.team._id, events };
  });
}

export const MOCK_TIMELINES_BY_TOURNAMENT: Record<
  string,
  DashboardStandingsTimeline[]
> = Object.fromEntries(
  MOCK_TOURNAMENTS.map((t) => [
    t._id,
    buildTimelines(MOCK_TEAMS_BY_TOURNAMENT[t._id], t),
  ]),
);

export type MockInboxItem =
  | {
      kind: "invitation";
      id: string;
      teamName: string;
      tournamentName: string;
      invitedBy: string;
      timestamp: number;
    }
  | {
      kind: "joinRequest";
      id: string;
      userName: string;
      teamName: string;
      timestamp: number;
    };

export const MOCK_INBOX: MockInboxItem[] = [
  {
    kind: "invitation",
    id: "inv_1",
    teamName: "Field Office",
    tournamentName: "Q2 Cross-Office",
    invitedBy: "Renata Mello",
    timestamp: todayMs - 3 * 3_600_000,
  },
  {
    kind: "joinRequest",
    id: "jr_1",
    userName: "Sam Okafor",
    teamName: "Urban Legends",
    timestamp: todayMs - 9 * 3_600_000,
  },
  {
    kind: "joinRequest",
    id: "jr_2",
    userName: "Priya Nair",
    teamName: "Urban Legends",
    timestamp: todayMs - 22 * 3_600_000,
  },
];

export type MockSubmissionStatus =
  | "none"
  | "one"
  | "at-limit"
  | "unlimited-pending";

export type MockViewMode =
  | "active-default"
  | "active-no-submission"
  | "active-at-limit"
  | "urgent-ending"
  | "ended-recent"
  | "empty";

export const MOCK_VIEWER = {
  firstName: "Andre",
};
