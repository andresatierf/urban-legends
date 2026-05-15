import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { TournamentCardData } from "./types";

export function ViewTournamentButton({ data }: { data: TournamentCardData }) {
  return (
    <Button asChild size="sm" className="shadow-sm">
      <Link to="/tournaments/$tournamentId" params={{ tournamentId: data._id }}>
        {data.authority.team ? "View" : "Browse Teams"}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}
