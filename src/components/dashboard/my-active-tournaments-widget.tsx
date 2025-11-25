import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { Doc } from "../../../convex/_generated/dataModel";

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
    <Card>
      <CardHeader>
        <CardTitle>My Active Tournaments</CardTitle>
        <CardDescription>
          Tournaments you're currently participating in
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeTournaments.length === 0 ? (
          <Empty>
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
              <div
                key={tournament._id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tournament.name}</h4>
                    <Badge variant="approved">Active</Badge>
                    {userRole === "captain" && (
                      <Badge variant="outline">Captain</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Team: {team.name} · {tournament.startDate} to{" "}
                    {tournament.endDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tournaments/${tournament._id}`}>
                      View Tournament
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teams/${team._id}`}>View Team</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
