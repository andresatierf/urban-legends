import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Separator } from "../../ui/separator";
import type { TournamentDetails } from "./types";

type Props = {
  tournament: TournamentDetails["tournament"];
};

export function RulesCard({ tournament }: Props) {
  const { individualPoints, teamExercisePoints } = tournament.scoringConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Team size</span>
          <span>
            {tournament.teamMinSize ?? "—"}–{tournament.teamMaxSize ?? "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Daily limit</span>
          <span>{tournament.maxSubmissionsPerDay ?? "∞"}</span>
        </div>
        <Separator />
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1">
          <span />
          <span className="text-muted-foreground text-center">Individual</span>
          <span className="text-muted-foreground text-center">Team</span>
          <span className="text-muted-foreground">Base</span>
          <span className="text-center">{individualPoints.base}</span>
          <span className="text-center">{teamExercisePoints.base}</span>
          <span className="text-muted-foreground">Advanced</span>
          <span className="text-center">{individualPoints.advanced}</span>
          <span className="text-center">{teamExercisePoints.advanced}</span>
        </div>
      </CardContent>
    </Card>
  );
}
