import { Trophy, Users } from "lucide-react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type Props = {
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  memberCount: number;
  userRole: "captain" | "member";
};

export function UserTeamCard({
  team,
  tournament,
  memberCount,
  userRole,
}: Props) {
  if (!team) return <UserTeamCardSkeleton />;

  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Button
                variant="link"
                className="h-min cursor-pointer p-0 font-semibold text-base leading-none tracking-tight"
                asChild
              >
                <Link href={`/teams/${team._id}`}>{team.name}</Link>
              </Button>
            </CardTitle>
            {userRole === "captain" && <Badge variant="outline">Captain</Badge>}
          </div>
          <CardDescription className="space-y-1">
            <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
              <Trophy className="h-4 w-4" />
              <Link
                href={`/tournaments/${tournament._id}`}
                className="hover:underline"
              >
                {tournament.name}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users className="h-3 w-3" />
              {memberCount}
              {team.maxMembers ? ` / ${team.maxMembers} ` : " "}
              members · {team.points ?? 0} points
            </div>
          </CardDescription>
        </div>
        <div className="flex xs:flex-col flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teams/${team._id}`}>View Team</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserTeamCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </div>
          <CardDescription className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-32" />
            </div>
          </CardDescription>
        </div>
        <div className="flex xs:flex-col flex-wrap gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}
