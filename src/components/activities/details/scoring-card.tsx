import type { Doc } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Eyebrow } from "../../ui/eyebrow";
import { Separator } from "../../ui/separator";

type Props = {
  activity: Doc<"activities">;
  tournament: Doc<"tournaments">;
};

export function ScoringCard({ activity, tournament }: Props) {
  const scoringTiers = activity.isTeamExercise
    ? tournament.scoringConfig.teamExercisePoints
    : tournament.scoringConfig.individualPoints;
  const isApproved = activity.state === "approved";
  const possiblePoints =
    activity.tier === "advanced" ? scoringTiers.advanced : scoringTiers.base;

  return (
    <Card>
      <CardHeader>
        <Eyebrow as="div">Points</Eyebrow>
        <CardTitle>Scoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span>
            {activity.isTeamExercise ? "Team exercise" : "Individual"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tier</span>
          <span className="capitalize">{activity.tier}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>{isApproved ? "Earned" : "Predicted"}</span>
          <span>{isApproved ? activity.pointsEarned : possiblePoints} pts</span>
        </div>
      </CardContent>
    </Card>
  );
}
