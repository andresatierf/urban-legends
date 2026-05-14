import { Link } from "@tanstack/react-router";
import { Crown, Users } from "lucide-react";

import { JoinTeamFormButton } from "../../form/join-team-form-button";
import { SectionHeader } from "../../section-header";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { getInitials } from "../../users/utils";
import type { TournamentDetails, TournamentTeam } from "./types";

type Props = {
  data: TournamentDetails;
  sortedTeams: TournamentTeam[];
};

export function TeamRosters({ data, sortedTeams }: Props) {
  if (sortedTeams.length === 0) return null;

  return (
    <>
      <SectionHeader as="h2" title="Team Rosters" Icon={Users} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sortedTeams.map((team) => {
          const isUserTeam = data.userTeam?._id === team._id;
          const isFull =
            team.maxMembers != null && team.memberCount >= team.maxMembers;
          return (
            <Card
              key={team._id}
              size="sm"
              className={isUserTeam ? "border-card-info-border" : undefined}
            >
              <CardContent className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{team.name}</span>
                  {isFull ? (
                    <Badge variant="error">Full</Badge>
                  ) : (
                    <Badge
                      variant={
                        team.joinPolicy === "open" ? "success" : "neutral"
                      }
                    >
                      {team.joinPolicy === "open" ? "Open" : "Closed"}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {team.members.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.memberRole === "captain" && (
                        <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="text-muted-foreground text-xs">
                    {team.memberCount}
                    {team.maxMembers && `/${team.maxMembers}`} members
                  </span>
                  <div className="flex items-center gap-1">
                    {!data.userTeam && data.status !== "ended" && (
                      <JoinTeamFormButton
                        teamId={team._id}
                        team={team}
                        currentMemberCount={team.memberCount}
                        isUserMember={isUserTeam}
                        isUserInTeam={false}
                        size="xs"
                      />
                    )}
                    <Button size="xs" variant="outline" asChild>
                      <Link to="/teams/$teamId" params={{ teamId: team._id }}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
