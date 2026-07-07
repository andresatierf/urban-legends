import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ChallengeDetailsData } from "./types";

export function AwardsCard({ data }: { data: ChallengeDetailsData }) {
  const isApproved = data.challenge.state === "approved";
  const rows = data.teamAwards.filter((a) => a.participantCount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-body-md flex items-center gap-2">
          <Trophy className="size-4" />
          Points awarded
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isApproved && (
          <p className="text-body-md text-muted-foreground">
            This Challenge is pending — no points have been awarded yet.
          </p>
        )}
        {rows.length === 0 ? (
          <p className="text-body-md text-muted-foreground">
            No team has any roster members.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => {
              const rate =
                row.teamSize > 0 ? row.participantCount / row.teamSize : 0;
              return (
                <li
                  key={row.teamId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {row.teamName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {row.participantCount}/{row.teamSize} participating (
                      {Math.round(rate * 100)}%)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={row.isTeamAward ? "success" : "neutral"}>
                      {row.isTeamAward ? "Team" : "Individual"}
                    </Badge>
                    {isApproved && (
                      <span className="text-sm font-medium">
                        +{row.amount} pts
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
