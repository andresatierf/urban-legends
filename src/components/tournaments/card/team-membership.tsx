import { Link } from "@tanstack/react-router";
import { Shield, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TournamentCardData } from "./types";

export function TeamMembership({ data }: { data: TournamentCardData }) {
  const team = data.authority.team;
  if (!team) return null;

  const total = team.totalSubmissions;
  const approved = team.approvedSubmissions;
  const ratio = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <Link
      to="/teams/$teamId"
      params={{ teamId: team._id }}
      className="border-ink bg-paper-deep hover:bg-paper-deep/70 shadow-fd-sm flex items-stretch gap-0 overflow-hidden rounded-xl border-2 transition-colors"
    >
      <div
        aria-hidden
        className={cn(
          "border-ink/15 flex items-center justify-center border-r px-3",
          team.isCaptain ? "bg-gold" : "bg-card",
        )}
      >
        <Star
          className={cn(
            "size-4",
            team.isCaptain ? "text-ink" : "text-muted-foreground",
          )}
          strokeWidth={2.5}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-semibold">{team.name}</span>
          {team.isCaptain && (
            <Badge variant="warning" size="xs">
              <Shield className="size-2" />
              Captain
            </Badge>
          )}
        </div>
        {total > 0 ? (
          <div className="flex items-center gap-2">
            <div className="border-ink/15 bg-paper h-1 flex-1 overflow-hidden rounded-full border">
              <div
                className="bg-success h-full"
                style={{ width: `${ratio}%` }}
              />
            </div>
            <span className="text-label-caps text-muted-foreground tabular-nums">
              {approved}/{total}
            </span>
          </div>
        ) : (
          <span className="text-label-caps text-muted-foreground">
            No submissions yet
          </span>
        )}
      </div>

      <div className="border-ink/15 flex flex-col items-end justify-center gap-0 border-l px-3 py-2">
        <span className="text-metric leading-none tabular-nums">
          {team.points}
        </span>
        <span className="text-label-caps text-muted-foreground">pts</span>
      </div>
    </Link>
  );
}
