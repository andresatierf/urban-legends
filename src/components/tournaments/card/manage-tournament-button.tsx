import { Link } from "@tanstack/react-router";
import { Edit } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { TournamentCardData } from "./types";

export function ManageTournamentButton({ data }: { data: TournamentCardData }) {
  if (!data.authority.canManage) return null;

  return (
    <Button asChild size="sm" variant="secondary" className="shadow-sm">
      <Link to={`/admin/tournaments?edit=${data._id}` as never}>
        <Edit className="h-3.5 w-3.5" />
        Manage
      </Link>
    </Button>
  );
}
