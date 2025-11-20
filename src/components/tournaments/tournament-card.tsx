import { Calendar, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
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
  if (!tournament) return <TournamentCardSkeleton />;

  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4">
        <div className="flex-1 xs:self-auto self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Button
                variant="link"
                className="h-min cursor-pointer p-0 font-semibold text-base leading-none tracking-tight"
                asChild
              >
                <Link href={`/tournaments/${tournament._id}`}>
                  {tournament.name}
                </Link>
              </Button>
            </CardTitle>
            {getStatusBadge(tournament)}
          </div>
          <CardDescription className="mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {teamCount} team{teamCount === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {`${new Date(tournament.startDate).toLocaleDateString()} to ${new Date(tournament.endDate).toLocaleDateString()}`}
            </div>
          </CardDescription>
        </div>
        <div className="flex gap-2 xs:self-auto self-end">
          <Button asChild>
            <Link href={`/tournaments/${tournament._id}`}>
              Browse Teams
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
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4">
        <div className="flex-1 xs:self-auto self-start">
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
        <div className="flex gap-2 xs:self-auto self-end">
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}
