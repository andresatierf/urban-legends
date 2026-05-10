import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { LogOut, Settings } from "lucide-react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import { JoinTeamFormButton } from "../../form/join-team-form-button";
import { Button } from "../../ui/button";
import { CardFooter } from "../../ui/card";
import type { TeamCardData } from "./types";

export function Footer({ data }: { data: TeamCardData }) {
  const { team, memberCount, isUserMember, isUserInTeam, userRole } = data;
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const canLeave =
    userRole === "member" || (userRole === "captain" && memberCount === 1);

  const handleLeave = () => {
    void tryMutate({
      fn: () => leaveTeam({ teamId: team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  };

  return (
    <CardFooter className="gap-2 px-4 py-3">
      {isUserMember ? (
        <>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/teams/$teamId" params={{ teamId: team._id }}>
              <Settings className="size-3.5" />
              Manage
            </Link>
          </Button>
          {canLeave && (
            <Button variant="ghost" size="sm" onClick={handleLeave}>
              <LogOut className="size-3.5" />
              Leave
            </Button>
          )}
        </>
      ) : (
        <>
          <JoinTeamFormButton
            teamId={team._id}
            team={team}
            currentMemberCount={memberCount}
            isUserMember={isUserMember}
            isUserInTeam={isUserInTeam}
            size="sm"
          />
          <Button variant="outline" size="sm" asChild>
            <Link to="/teams/$teamId" params={{ teamId: team._id }}>
              View
            </Link>
          </Button>
        </>
      )}
    </CardFooter>
  );
}
