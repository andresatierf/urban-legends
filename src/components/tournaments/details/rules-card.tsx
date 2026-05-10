import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Separator } from "../../ui/separator";
import type { TournamentDetails } from "./types";

type Props = {
  tournament: TournamentDetails["tournament"];
};

export function RulesCard({ tournament }: Props) {
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
        <div className="flex justify-between">
          <span className="text-muted-foreground">Individual</span>
          <span>
            {tournament.scoringConfig.individualPoints.base}/
            {tournament.scoringConfig.individualPoints.advanced}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Team exercise</span>
          <span>
            {tournament.scoringConfig.teamExercisePoints.base}/
            {tournament.scoringConfig.teamExercisePoints.advanced}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
