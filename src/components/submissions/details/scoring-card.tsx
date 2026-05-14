import type { Doc } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Eyebrow } from "../../ui/eyebrow";
import { Separator } from "../../ui/separator";

type Props = {
  submission: Doc<"submissions">;
  tournament: Doc<"tournaments">;
};

export function ScoringCard({ submission, tournament }: Props) {
  const isTeamSubmission = submission.submissionType === "team";
  const scoringTiers = isTeamSubmission
    ? tournament.scoringConfig.teamExercisePoints
    : tournament.scoringConfig.individualPoints;
  const isApproved = submission.state === "approved";
  const possiblePoints =
    submission.tier === "advanced" ? scoringTiers.advanced : scoringTiers.base;

  return (
    <Card>
      <CardHeader>
        <Eyebrow as="div">Points</Eyebrow>
        <CardTitle className="text-h3">Scoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span>{isTeamSubmission ? "Team exercise" : "Individual"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tier</span>
          <span className="capitalize">{submission.tier}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>{isApproved ? "Earned" : "Predicted"}</span>
          <span>
            {isApproved ? submission.pointsEarned : possiblePoints} pts
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
