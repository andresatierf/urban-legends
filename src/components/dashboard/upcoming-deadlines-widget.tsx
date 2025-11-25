import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { Doc } from "../../../convex/_generated/dataModel";

interface UpcomingDeadlinesWidgetProps {
  deadlines: Array<{
    tournament: Doc<"tournaments">;
    daysUntilEnd: number;
  }>;
}

export function UpcomingDeadlinesWidget({
  deadlines,
}: UpcomingDeadlinesWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>Tournaments ending soon</CardDescription>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <Empty className="gap-3 p-2!">
            <EmptyTitle>No upcoming deadlines</EmptyTitle>
            <EmptyDescription>
              You'll see tournaments ending soon here.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-3">
            {deadlines.map(({ tournament, daysUntilEnd }) => (
              <Link
                key={tournament._id}
                href={`/tournaments/${tournament._id}/leaderboard`}
                className="block rounded-md p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{tournament.name}</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-muted-foreground text-xs">
                        Ends in {daysUntilEnd} day
                        {daysUntilEnd !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={daysUntilEnd <= 3 ? "destructive" : "secondary"}
                  >
                    {daysUntilEnd <= 3 ? "Urgent" : "Soon"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
