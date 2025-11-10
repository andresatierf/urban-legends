import { Users } from "lucide-react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { JoinTeamFormButton } from "../form/join-team-form-button";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";

export function TeamCard({
  team,
  memberCount,
  isUserMember,
  isUserInTeam,
}: {
  team: Doc<"teams">;
  memberCount: number;
  isUserMember: boolean;
  isUserInTeam: boolean;
}) {
  const isFull = team.maxMembers && memberCount >= team.maxMembers;

  return (
    <Card key={team._id}>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4 xs:gap-16">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Button
                variant="link"
                className="h-min cursor-pointer p-0 font-semibold text-md leading-none tracking-tight"
                asChild
              >
                <Link href={`/teams/${team._id}`}>{team.name}</Link>
              </Button>
            </CardTitle>
            <Badge
              variant={team.visibility === "public" ? "default" : "secondary"}
            >
              {team.visibility}
            </Badge>
            {isFull && <Badge variant="destructive">Full</Badge>}
          </div>
          {/* FIX: move this to bottom of card */}
          <CardDescription className="mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {memberCount}
              {team.maxMembers ? ` / ${team.maxMembers} ` : " "}
              members
            </div>
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2">
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
