import type { Doc } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

function formatLongDate(input: string | number): string {
  return new Date(input).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Props = {
  submission: Doc<"submissions">;
};

export function DescriptionCard({ submission }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {formatLongDate(submission.date)}
        </CardTitle>
      </CardHeader>
      {submission.description && (
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {submission.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
