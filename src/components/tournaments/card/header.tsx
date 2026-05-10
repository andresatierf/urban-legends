import type { TournamentCardData } from "./types";

export function Header({ data }: { data: TournamentCardData }) {
  return (
    <div>
      <h3 className="font-heading text-sm font-medium">{data.name}</h3>
      {data.description && (
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
          {data.description}
        </p>
      )}
    </div>
  );
}
