import type { TournamentCardData } from "./types";

export function Header({ data }: { data: TournamentCardData }) {
  if (!data.description) return null;
  return (
    <p className="text-muted-foreground line-clamp-2 text-xs">
      {data.description}
    </p>
  );
}
