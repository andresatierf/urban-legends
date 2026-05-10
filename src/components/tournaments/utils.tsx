import type { Doc } from "../../../convex/_generated/dataModel";
import type { TournamentWithAuthority } from "../../../convex/tournaments";
import { Badge } from "../ui/badge";

export const getStatusBadge = (tournament: Doc<"tournaments">) => {
  const status = getTournamentStatus(tournament);

  switch (status) {
    case "upcoming":
      return <Badge variant="outline">Upcoming</Badge>;
    case "active":
      return <Badge variant="default">Active</Badge>;
    case "ended":
      return <Badge variant="secondary">Ended</Badge>;
  }
};

export type TournamentStatus = "active" | "upcoming" | "ended";

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
};

export function getTournamentStatus(t: {
  startDate: string;
  endDate: string;
}): TournamentStatus {
  const now = new Date().toISOString();
  if (t.startDate <= now && t.endDate >= now) return "active";
  if (t.startDate > now) return "upcoming";
  return "ended";
}

export function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function tournamentProgress(t: { startDate: string; endDate: string }) {
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function partitionTournaments(tournaments: TournamentWithAuthority[]) {
  const now = new Date().toISOString();
  const active: TournamentWithAuthority[] = [];
  const upcoming: TournamentWithAuthority[] = [];
  const ended: TournamentWithAuthority[] = [];

  for (const t of tournaments) {
    if (t.startDate <= now && t.endDate >= now) active.push(t);
    else if (t.startDate > now) upcoming.push(t);
    else ended.push(t);
  }

  return { active, upcoming, ended };
}
