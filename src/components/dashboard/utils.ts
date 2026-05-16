import type {
  DashboardActivity,
  DashboardStandingsTimeline,
  DashboardTeam,
  DashboardTournament,
} from "./types";

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86_400_000 +
      startOfYear.getDay() +
      1) /
      7,
  );
}

export function isTournamentActive(
  tournament: { startDate: string; endDate: string },
  todayStr: string,
): boolean {
  return tournament.startDate <= todayStr && tournament.endDate >= todayStr;
}

export function getActiveTeams(
  teams: DashboardTeam[],
  todayStr: string,
): DashboardTeam[] {
  return teams.filter((t) => isTournamentActive(t.tournament, todayStr));
}

export function sortByPointsDesc(teams: DashboardTeam[]): DashboardTeam[] {
  return [...teams].sort((a, b) => b.team.points - a.team.points);
}

export function getLastDays(today: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return toIsoDate(d);
  });
}

export function getStreakDays(
  activities: DashboardActivity[],
  today: Date,
  windowDays = 7,
): number {
  const activeDaySet = new Set(
    activities.map((a) => toIsoDate(new Date(a.timestamp))),
  );
  return getLastDays(today, windowDays).filter((d) => activeDaySet.has(d))
    .length;
}

export function getApprovedSparkline(
  activities: DashboardActivity[],
  today: Date,
  windowDays = 7,
): number[] {
  return getLastDays(today, windowDays)
    .slice()
    .reverse()
    .map(
      (d) =>
        activities.filter(
          (a) =>
            a.type === "submission_approved" &&
            toIsoDate(new Date(a.timestamp)) === d,
        ).length,
    );
}

export function getStreakSparkline(
  activities: DashboardActivity[],
  today: Date,
  windowDays = 7,
): number[] {
  const activeDaySet = new Set(
    activities.map((a) => toIsoDate(new Date(a.timestamp))),
  );
  return getLastDays(today, windowDays)
    .slice()
    .reverse()
    .map((d) => (activeDaySet.has(d) ? 1 : 0));
}

export function countApprovedToday(
  activities: DashboardActivity[],
  todayStr: string,
): number {
  return activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      toIsoDate(new Date(a.timestamp)) === todayStr,
  ).length;
}

export function countApprovedSince(
  activities: DashboardActivity[],
  sinceMs: number,
): number {
  return activities.filter(
    (a) => a.type === "submission_approved" && a.timestamp >= sinceMs,
  ).length;
}

export type MvpEntry = {
  team: DashboardTeam;
  submissionsToday: number;
  submissionsAllTime: number;
};

export function getMvpEntry(
  teams: DashboardTeam[],
  activities: DashboardActivity[],
  todayStr: string,
): MvpEntry | null {
  if (teams.length === 0) return null;
  const stats: MvpEntry[] = teams.map((t) => ({
    team: t,
    submissionsToday: activities.filter(
      (a) =>
        a.type === "submission_approved" &&
        a.description.includes(t.team.name) &&
        toIsoDate(new Date(a.timestamp)) === todayStr,
    ).length,
    submissionsAllTime: activities.filter(
      (a) =>
        a.type === "submission_approved" && a.description.includes(t.team.name),
    ).length,
  }));
  return (
    [...stats].sort(
      (a, b) =>
        b.submissionsToday - a.submissionsToday ||
        b.submissionsAllTime - a.submissionsAllTime ||
        b.team.team.points - a.team.team.points,
    )[0] ?? null
  );
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

export function getTournamentProgress(
  tournament: { startDate: string; endDate: string },
  now: number,
): number {
  const start = new Date(tournament.startDate).getTime();
  const end = new Date(tournament.endDate).getTime();
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), total);
  return Math.round((elapsed / total) * 100);
}

export function getWeekStartMs(today: Date, windowDays = 7): number {
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (windowDays - 1));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.getTime();
}

export function extractName(description: string): string {
  const match = description.match(/^([A-Z][a-z]+)/);
  return match ? match[1] : "Your teammate";
}

export function activityDotColorClass(type: string): string {
  if (type === "submission_approved") return "bg-grass";
  if (type === "team_member_joined") return "bg-sky";
  if (type.includes("join_request")) return "bg-plum";
  if (type === "submission_rejected") return "bg-sunset";
  return "bg-mute";
}

export function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
