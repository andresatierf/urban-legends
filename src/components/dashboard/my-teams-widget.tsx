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

interface MyTeamsWidgetProps {
  teams: Array<{
    team: Doc<"teams">;
    tournament: Doc<"tournaments">;
    memberCount: number;
    userRole: "captain" | "member";
  }>;
}

export function MyTeamsWidget({ teams }: MyTeamsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Teams</CardTitle>
        <CardDescription>All teams you're a member of</CardDescription>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <Empty>
            <EmptyTitle>No teams yet</EmptyTitle>
            <EmptyDescription>
              Join or create a team to participate in tournaments.
            </EmptyDescription>
            <Button asChild className="mt-4">
              <Link href="/tournaments">Find a Tournament</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {teams.map(({ team, tournament, memberCount, userRole }) => (
              <Link
                key={team._id}
                href={`/teams/${team._id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{team.name}</h4>
                      {userRole === "captain" && (
                        <Badge variant="outline">Captain</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {tournament.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {memberCount} member{memberCount !== 1 ? "s" : ""} ·{" "}
                      {team.points ?? 0} points
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
