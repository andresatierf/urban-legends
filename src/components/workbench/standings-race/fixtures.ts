import type {
  DashboardTeam,
  DashboardTournament,
} from "@/components/workbench/dashboard/legacy-types";
import type {
  StandingsChartData,
  StandingsGroup,
} from "@/components/workbench/dashboard/legacy-utils";

import type { Id } from "../../../../convex/_generated/dataModel";

const dayMs = 86_400_000;

type StandingsFixtureOptions = {
  tournamentName?: string;
  tournamentId?: string;
  startOffsetDays?: number;
  durationDays?: number;
  /** Days elapsed since tournament start that should be reflected in points. */
  elapsedDays?: number;
  teams?: ReadonlyArray<{
    id?: string;
    name: string;
    points: number;
    userRole?: "captain" | "member" | "rival";
    isUserTeam?: boolean;
  }>;
};

const DEFAULT_TEAMS: NonNullable<StandingsFixtureOptions["teams"]> = [
  {
    name: "Urban Divas ✨",
    points: 540,
    userRole: "captain",
    isUserTeam: true,
  },
  { name: "Booldozers", points: 480, userRole: "rival" },
  { name: "Sedentários em Revolução", points: 410, userRole: "rival" },
  { name: "404 Shape Not Found", points: 320, userRole: "rival" },
  { name: "Legends on Tap", points: 250, userRole: "rival" },
  { name: "Couch Quitters", points: 180, userRole: "rival" },
];

export type StandingsFixture = {
  group: StandingsGroup;
  chartData: StandingsChartData;
  userTeamId: string;
};

function dateStr(now: Date, offsetDays: number): string {
  return new Date(now.getTime() + offsetDays * dayMs)
    .toISOString()
    .slice(0, 10);
}

/**
 * Build a synthetic StandingsGroup + StandingsChartData pair shaped like the
 * Convex FunctionReturnType slices the dashboard consumes. Points are
 * distributed across the elapsed window with a small per-day jitter so the
 * race chart reads as a plausible standings curve.
 */
export function makeStandingsFixture(
  options: StandingsFixtureOptions = {},
): StandingsFixture {
  const {
    tournamentName = "Urban Legends 2026",
    tournamentId = "demo-tour-standings",
    startOffsetDays = -14,
    durationDays = 30,
    elapsedDays = 14,
    teams = DEFAULT_TEAMS,
  } = options;

  const now = new Date();
  const tournament: DashboardTournament = {
    _id: tournamentId as Id<"tournaments">,
    _creationTime: 0,
    name: tournamentName,
    description: "Synthetic standings fixture for the workbench.",
    startDate: dateStr(now, startOffsetDays),
    endDate: dateStr(now, startOffsetDays + durationDays),
    teamMinSize: 2,
    teamMaxSize: 8,
    createdBy: "demo-user" as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
  };

  const userTeamId = teams.find((t) => t.isUserTeam)?.id ?? "demo-team-0";

  const dashboardTeams: DashboardTeam[] = teams.map((t, idx) => {
    const teamId = (t.id ?? `demo-team-${idx}`) as Id<"teams">;
    return {
      team: {
        _id: teamId,
        _creationTime: 0,
        name: t.name,
        tournamentId: tournament._id,
        createdBy: "demo-user" as Id<"users">,
        joinPolicy: "open" as const,
        points: t.points,
      },
      tournament,
      memberCount: 4,
      userRole: (t.userRole ?? "rival") as DashboardTeam["userRole"],
    } as DashboardTeam;
  });

  const sorted = [...dashboardTeams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const maxPts = Math.max(...sorted.map((t) => t.team.points), 1);

  const group: StandingsGroup = {
    tournament,
    teams: sorted,
    maxPts,
  };

  const startMs = new Date(tournament.startDate).getTime();
  const clampedElapsed = Math.max(1, Math.min(elapsedDays, durationDays));
  const days = Array.from(
    { length: clampedElapsed + 1 },
    (_, i) => startMs + i * dayMs,
  );

  const series = sorted.map((t, teamIdx) => {
    const total = t.team.points;
    const dailyAvg = total / clampedElapsed;
    const points: number[] = [0];
    let running = 0;
    for (let d = 1; d < days.length; d++) {
      const jitter = ((teamIdx + d) % 3) - 1;
      const inc = Math.max(0, Math.round(dailyAvg + jitter));
      running = Math.min(total, running + inc);
      if (d === days.length - 1) running = total;
      points.push(running);
    }
    return {
      teamId: t.team._id,
      teamName: t.team.name,
      points,
      total,
    };
  });

  const chartData: StandingsChartData = {
    days,
    maxPoints: Math.max(...series.flatMap((s) => s.points), 1),
    series,
  };

  return { group, chartData, userTeamId };
}

export const DEFAULT_STANDINGS_FIXTURE = makeStandingsFixture();

export const FLAT_STANDINGS_FIXTURE = makeStandingsFixture({
  tournamentName: "Captains Cup Spring",
  tournamentId: "demo-tour-standings-flat",
  teams: [
    {
      name: "Apex Drifters",
      points: 120,
      userRole: "captain",
      isUserTeam: true,
    },
    { name: "City Sloths", points: 100, userRole: "rival" },
    { name: "Stairmasters", points: 80, userRole: "rival" },
  ],
  elapsedDays: 6,
  durationDays: 14,
  startOffsetDays: -6,
});

export const SINGLE_TEAM_FIXTURE = makeStandingsFixture({
  tournamentName: "Solo Climb",
  tournamentId: "demo-tour-standings-solo",
  teams: [
    {
      name: "Lone Wolf",
      points: 210,
      userRole: "captain",
      isUserTeam: true,
    },
  ],
});
