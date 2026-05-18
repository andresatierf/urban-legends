import type { DashboardView } from "./types";

const DAY_MS = 86_400_000;

export function buildChartData(
  selected: NonNullable<DashboardView["selected"]>,
  nowMs: number,
) {
  const startMs = new Date(selected.tournament.startDate).getTime();
  const endMs = Math.min(
    new Date(selected.tournament.endDate).getTime(),
    nowMs,
  );
  const totalDays = Math.max(Math.ceil((endMs - startMs) / DAY_MS), 1);
  const days = Array.from(
    { length: totalDays + 1 },
    (_, i) => startMs + i * DAY_MS,
  );

  const timelinesByTeam = new Map(
    selected.timeline.map((tl) => [tl.teamId, tl.events]),
  );

  const series = selected.teams.map((t) => {
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

  return { days, series };
}

export function formatEndDate(endDate: string): string {
  return new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
