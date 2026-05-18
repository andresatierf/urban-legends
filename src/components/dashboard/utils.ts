import type {
  DashboardStandingsTimeline,
  DashboardTeam,
  DashboardTournament,
} from "./types";

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isTournamentActive(
  tournament: { startDate: string; endDate: string },
  todayStr: string,
): boolean {
  return tournament.startDate <= todayStr && tournament.endDate >= todayStr;
}

export function sortByPointsDesc(teams: DashboardTeam[]): DashboardTeam[] {
  return [...teams].sort((a, b) => b.team.points - a.team.points);
}

export type StandingsGroup = {
  tournament: DashboardTournament;
  teams: DashboardTeam[];
  maxPts: number;
};

export function buildStandingsGroups(
  allTeams: DashboardTeam[],
  todayStr: string,
): StandingsGroup[] {
  const map = new Map<
    string,
    { tournament: DashboardTournament; teams: DashboardTeam[] }
  >();
  for (const t of allTeams) {
    const id = t.tournament._id;
    const existing = map.get(id);
    if (existing) {
      existing.teams.push(t);
    } else {
      map.set(id, { tournament: t.tournament, teams: [t] });
    }
  }
  const groups: StandingsGroup[] = [...map.values()].map((g) => ({
    tournament: g.tournament,
    teams: sortByPointsDesc(g.teams),
    maxPts: Math.max(...g.teams.map((x) => x.team.points), 1),
  }));
  groups.sort((a, b) => {
    const aActive = isTournamentActive(a.tournament, todayStr) ? 0 : 1;
    const bActive = isTournamentActive(b.tournament, todayStr) ? 0 : 1;
    return aActive - bActive;
  });
  return groups;
}

export type StandingsChartData = {
  days: number[];
  maxPoints: number;
  series: Array<{
    teamId: string;
    teamName: string;
    points: number[];
    total: number;
  }>;
};

export function buildStandingsChartData(
  group: StandingsGroup,
  timelines: DashboardStandingsTimeline[],
  today: Date,
): StandingsChartData {
  const startMs = new Date(group.tournament.startDate).getTime();
  const endMs = Math.min(
    new Date(group.tournament.endDate).getTime(),
    today.getTime(),
  );
  const totalDays = Math.max(Math.ceil((endMs - startMs) / 86_400_000), 1);
  const days = Array.from(
    { length: totalDays + 1 },
    (_, i) => startMs + i * 86_400_000,
  );
  const timelinesByTeam = new Map(
    timelines.map((tl) => [tl.teamId, tl.events]),
  );
  const series = group.teams.map((t) => {
    const events = (timelinesByTeam.get(t.team._id) ?? []).filter(
      (e) => e.timestamp >= startMs && e.timestamp <= endMs,
    );
    const points = days.map((d) =>
      events.reduce((sum, e) => (e.timestamp <= d ? sum + e.points : sum), 0),
    );
    if (points.length > 0 && events.length > 0) {
      points[points.length - 1] = t.team.points;
    }
    return {
      teamId: t.team._id,
      teamName: t.team.name,
      points,
      total: t.team.points,
    };
  });
  const maxPoints = Math.max(...series.flatMap((s) => s.points), 1);
  return { days, maxPoints, series };
}
