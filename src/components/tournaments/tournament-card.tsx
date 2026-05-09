import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Users } from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { getStatusBadge } from "./utils";

type Props = {
  tournament: Doc<"tournaments">;
  teamCount: number;
};

export function TournamentCard({ tournament, teamCount }: Props) {
  const { format } = useFormattedDate();

  if (!tournament) return <TournamentCardSkeleton />;

  return (
    <Card>
      <CardContent className="xs:flex-row flex h-full flex-col items-center justify-between gap-4">
        <div className="xs:self-auto flex h-full flex-1 flex-col justify-between self-start">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{tournament.name}</CardTitle>
            {getStatusBadge(tournament)}
          </div>
          <CardDescription className="mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {teamCount} team{teamCount === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-1 text-balance">
              <Calendar className="h-4 w-4" />
              {format(tournament.startDate, "short")} to{" "}
              {format(tournament.endDate, "short")}
            </div>
          </CardDescription>
        </div>
        <div className="xs:self-auto flex gap-2 self-end">
          <Button asChild>
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: tournament._id }}
            >
              <span className="text-wrap">Browse Teams</span>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TournamentCardSkeleton() {
  return (
    <Card>
      <CardContent className="xs:flex-row flex flex-col items-center justify-between gap-4">
        <div className="xs:self-auto flex-1 self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Skeleton className="h-6 w-64" />
            </CardTitle>
          </div>
          <CardDescription className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-40" />
            </div>
          </CardDescription>
        </div>
        <div className="xs:self-auto flex gap-2 self-end">
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}
