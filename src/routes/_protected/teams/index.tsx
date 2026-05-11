import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";

import {
  TeamListing,
  TeamListingSkeleton,
} from "@/components/teams/listing/layout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  const { user } = useUser();
  const userTeams = useQuery(api.teams.listWithMembers, { userId: user?._id });
  const allTeams = useQuery(api.teams.listWithMembers, {});

  const tournamentIds = (allTeams ?? []).map((t) => t.tournamentId);
  const tournaments = useQuery(
    api.tournaments.list,
    tournamentIds.length > 0 ? { tournamentIds } : "skip",
  );

  const headerActions = (
    <Button asChild variant="outline" size="sm">
      <Link to="/tournaments">
        <Trophy />
        View Tournaments
      </Link>
    </Button>
  );

  if (
    userTeams === undefined ||
    allTeams === undefined ||
    (tournamentIds.length > 0 && tournaments === undefined)
  ) {
    return <TeamListingSkeleton headerActions={headerActions} />;
  }

  const tournamentMap = (tournaments ?? []).reduce<
    Record<Id<"tournaments">, Doc<"tournaments">>
  >((acc, t) => {
    acc[t._id] = t;
    return acc;
  }, {});

  return (
    <TeamListing
      userTeams={userTeams}
      allTeams={allTeams}
      tournamentMap={tournamentMap}
      headerActions={headerActions}
    />
  );
}
