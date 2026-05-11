import { Link } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";

import { Button } from "../../ui/button";
import { CardFooter } from "../../ui/card";
import type { TeamCardData } from "./types";

type Props = {
  data: TeamCardData;
  onLeave?: () => void;
  joinSlot?: React.ReactNode;
};

export function Footer({ data, onLeave, joinSlot }: Props) {
  const { team, memberCount, isUserMember, userRole } = data;

  const canLeave =
    userRole === "member" || (userRole === "captain" && memberCount === 1);

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
          {canLeave && onLeave && (
            <Button variant="ghost" size="sm" onClick={onLeave}>
              <LogOut className="size-3.5" />
              Leave
            </Button>
          )}
        </>
      ) : (
        <>
          {joinSlot}
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
