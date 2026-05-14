import { Link } from "@tanstack/react-router";
import { Shield, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { TournamentCardData } from "./types";

export function TeamMembership({ data }: { data: TournamentCardData }) {
  const team = data.authority.team;
  if (!team) return null;

  return (
    <Link
      to="/teams/$teamId"
      params={{ teamId: team._id }}
      className="hover:bg-muted/30 block rounded-md border transition-colors"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{team.name}</span>
          {team.isCaptain && (
            <Badge variant="warning" className="flex items-center gap-0.5">
              <Shield className="h-2.5 w-2.5" />
              Captain
            </Badge>
          )}
        </div>
      </div>
      <div className="border-t px-3 py-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <Star className="text-primary h-3 w-3" />
            <span className="font-semibold">{team.points}</span>
            <span className="text-muted-foreground">pts</span>
          </span>
          <span className="text-muted-foreground">
            {team.approvedSubmissions}/{team.totalSubmissions} approved
          </span>
        </div>
      </div>
    </Link>
  );
}
