import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { TeamCardData } from "./types";

export function OpenTeamButton({ data }: { data: TeamCardData }) {
  return (
    <Button asChild size="sm" variant="default" className="shadow-sm">
      <Link to="/teams/$teamId" params={{ teamId: data.team._id }}>
        {data.isUserMember ? (
          <>
            <Settings className="size-3.5" />
            Manage
          </>
        ) : (
          "View"
        )}
      </Link>
    </Button>
  );
}
