import { Calendar, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";

type Props = {
  tournament: Doc<"tournaments">;
  teamCount: number;
};

export function TournamentCard({ tournament, teamCount }: Props) {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  const isActive = startDate <= now && now <= endDate;
  const isEnded = endDate < now;
  const isUpcoming = startDate > now;

  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4 xs:gap-16">
        <div className="flex-1 xs:self-auto self-start">
          <div className="flex items-center gap-4">
            <CardTitle>
              <Button
                variant="link"
                className="h-min cursor-pointer p-0 font-semibold text-md leading-none tracking-tight"
                asChild
              >
                <Link href={`/tournaments/${tournament._id}`}>
                  {tournament.name}
                </Link>
              </Button>
            </CardTitle>
            <Badge
              variant={
                isActive ? "approved" : isUpcoming ? "pending" : "rejected"
              }
            >
              {isActive
                ? "Active"
                : isUpcoming
                  ? "Upcoming"
                  : isEnded
                    ? "Ended"
                    : "Unknown"}
            </Badge>
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
