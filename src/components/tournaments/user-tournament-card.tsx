import { format } from "date-fns";
import { Calendar, Users } from "lucide-react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { getStatusBadge } from "./utils";

type Props = {
  tournament: Doc<"tournaments">;
  team: Doc<"teams">;
  userRole: "captain" | "member";
};

export function UserTournamentCard({ tournament, team, userRole }: Props) {
  if (!tournament) return <UserTournamentCardSkeleton />;

  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4">
        <div className="flex-1 xs:self-auto self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Link
                href={`/tournaments/${tournament._id}`}
                className="hover:underline"
              >
                {tournament.name}
              </Link>
            </CardTitle>
            {getStatusBadge(tournament)}
            {userRole === "captain" && <Badge variant="outline">Captain</Badge>}
          </div>
          <CardDescription className="mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <Link href={`/teams/${team._id}`} className="hover:underline">
                {team.name}
              </Link>
            </div>
            <div className="flex items-center gap-1 text-balance">
              <Calendar className="h-4 w-4" />
              {format(new Date(tournament.startDate), "MMM d, yyyy")} to{" "}
              {format(new Date(tournament.endDate), "MMM d, yyyy")}
            </div>
          </CardDescription>
        </div>
        <div className="flex flex-wrap xs:justify-end justify-center gap-2 xs:self-auto self-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tournaments/${tournament._id}`}>View Tournament</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teams/${team._id}`}>View Team</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserTournamentCardSkeleton() {
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
