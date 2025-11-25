import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { Doc } from "../../../convex/_generated/dataModel";
import { SectionHeader } from "../section-header";
import { UserTournamentCard } from "../tournaments/user-tournament-card";

interface MyActiveTournamentsWidgetProps {
  teams: Array<{
    team: Doc<"teams">;
    tournament: Doc<"tournaments">;
    userRole: "captain" | "member";
    memberCount: number;
  }>;
}

export function MyActiveTournamentsWidget({
  teams,
}: MyActiveTournamentsWidgetProps) {
  const now = new Date().toISOString();

  // Filter for active tournaments only
  const activeTournaments = teams.filter(
    (t) => t.tournament.startDate <= now && t.tournament.endDate >= now,
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="My Active Tournaments" />
      {activeTournaments.length === 0 ? (
        <Empty className="gap-3 py-2!">
          <EmptyTitle>No active tournaments</EmptyTitle>
          <EmptyDescription>
            Join a tournament to start competing with your team.
          </EmptyDescription>
          <Button asChild className="mt-4">
            <Link href="/tournaments">Browse Tournaments</Link>
          </Button>
        </Empty>
      ) : (
        <div className="space-y-4">
          {activeTournaments.map(({ team, tournament, userRole }) => (
            <UserTournamentCard
              key={tournament._id}
              tournament={tournament}
              team={team}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
