import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { TournamentSwitcher } from "@/components/common/tournament-switcher";
import { Button } from "@/components/ui/button";

import type { Doc } from "../../../../convex/_generated/dataModel";

type Props = {
  visibleTournaments: Doc<"tournaments">[];
  effectiveFilter: string;
  setFilter: (id: string) => void;
  hasEndedTournaments: boolean;
  includeEnded: boolean;
  setIncludeEnded: (next: boolean | ((v: boolean) => boolean)) => void;
};

export function ListingFilterBar({
  visibleTournaments,
  effectiveFilter,
  setFilter,
  hasEndedTournaments,
  includeEnded,
  setIncludeEnded,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleTournaments.length > 1 && (
        <TournamentSwitcher
          tournaments={visibleTournaments}
          selectedTournamentId={effectiveFilter}
          onSelect={setFilter}
          label="Tournament"
          allOption={{ value: "all", label: "All tournaments" }}
        />
      )}
      {effectiveFilter !== "all" && (
        <Button size="sm" asChild>
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: effectiveFilter }}
          >
            View tournament
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      )}
      {hasEndedTournaments && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIncludeEnded((v) => !v)}
        >
          {includeEnded ? "Hide past" : "Show past"}
        </Button>
      )}
    </div>
  );
}
