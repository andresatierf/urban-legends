import { Trophy, Users } from "lucide-react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { JoinTeamFormButton } from "../form/join-team-form-button";
import { getStatusBadge } from "../tournaments/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type Props = {
  team: Doc<"teams">;
  tournament?: Doc<"tournaments">;
  memberCount: number;
  isUserMember: boolean;
  isUserInTeam: boolean;
};

export function TeamCard({
  team,
  tournament,
  memberCount,
  isUserMember,
  isUserInTeam,
}: Props) {
  if (!team) return <TeamCardSkeleton />;

  const isFull = team.maxMembers && memberCount >= team.maxMembers;

  return (
    <Card key={team._id}>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle>{team.name}</CardTitle>
            <Badge
              variant={team.visibility === "public" ? "default" : "secondary"}
            >
              {team.visibility}
            </Badge>
            {isFull && <Badge variant="destructive">Full</Badge>}
          </div>
          <CardDescription className="mt-2">
            {tournament && (
              <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                <Trophy className="h-4 w-4" />
                <Link
                  href={`/tournaments/${tournament._id}`}
                  className="hover:underline"
                >
                  {tournament.name}
                </Link>
                {getStatusBadge(tournament)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {memberCount}
              {team.maxMembers ? ` / ${team.maxMembers} ` : " "}
              members
            </div>
          </CardDescription>
        </div>
        <div className="flex xs:flex-col flex-wrap gap-2">
          <JoinTeamFormButton
            teamId={team._id}
            team={team}
            currentMemberCount={memberCount}
            isUserMember={isUserMember}
            isUserInTeam={isUserInTeam}
          />
          <Button variant="outline" asChild>
            <Link href={`/teams/${team._id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamCardSkeleton() {
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
