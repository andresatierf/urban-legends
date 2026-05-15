import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import type { TeamCardData } from "./types";

export function ViewTeamButton({ data }: { data: TeamCardData }) {
  if (data.isUserMember) return null;

  return (
    <Button asChild size="sm" variant="default" className="shadow-sm">
      <Link to="/teams/$teamId" params={{ teamId: data.team._id }}>
        View
      </Link>
    </Button>
  );
}
