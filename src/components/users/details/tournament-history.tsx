import { Trophy } from "lucide-react";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Eyebrow } from "../../ui/eyebrow";
import type { UserDetails } from "./types";

export function TournamentHistory({ data }: { data: UserDetails }) {
  const { teams } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Tournament history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            No tournaments yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {teams.map((team, idx) => (
              <li
                key={team._id}
                className="border-border/40 flex items-center justify-between gap-4 rounded-md border p-3"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="text-metric text-muted-foreground w-8 text-right tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <Eyebrow as="div" className="mb-0.5">
                      {team.tournamentName}
                    </Eyebrow>
                    <p className="text-body-md truncate font-medium">
                      {team.name}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={team.role === "captain" ? "warning" : "neutral"}
                >
                  {team.role}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
