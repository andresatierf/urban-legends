export type TournamentStatus = "active" | "upcoming" | "ended";

export function getStatus(t: {
  startDate: string;
  endDate: string;
}): TournamentStatus {
  const now = Date.now();
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  if (start > now) return "upcoming";
  if (end < now) return "ended";
  return "active";
}

export function getProgress(t: { startDate: string; endDate: string }): number {
  const now = Date.now();
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function daysUntil(iso: string) {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export function formatShortDate(
  iso: string,
  { year = false }: { year?: boolean } = {},
) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(year && { year: "numeric" as const }),
  });
}
