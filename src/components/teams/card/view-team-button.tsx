import { Link } from "@tanstack/react-router";

import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { Button } from "@/components/ui/button";

import type { TeamCardData } from "./types";

export function ViewTeamButton({ data }: { data: TeamCardData }) {
  if (data.isUserMember) return null;

  return (
    <EdgeOverlay position="bottom-right">
      <Button asChild size="sm" variant="default" className="shadow-sm">
        <Link to="/teams/$teamId" params={{ teamId: data.team._id }}>
          View
        </Link>
      </Button>
    </EdgeOverlay>
  );
}
