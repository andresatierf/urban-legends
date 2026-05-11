import { Link } from "@tanstack/react-router";
import { ArrowRight, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { TournamentCardData } from "./types";

export function Footer({ data }: { data: TournamentCardData }) {
  const { authority } = data;

  return (
    <div className="flex gap-2">
      {authority.canManage && (
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/admin/tournaments?edit=${data._id}` as never}>
            <Edit className="h-3.5 w-3.5" />
            Manage
          </Link>
        </Button>
      )}
      <Button size="sm" className="flex-1" asChild>
        <Link
          to="/tournaments/$tournamentId"
          params={{ tournamentId: data._id }}
        >
          {authority.team ? "View" : "Browse Teams"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
