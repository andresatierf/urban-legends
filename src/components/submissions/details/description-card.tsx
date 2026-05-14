import type { Doc } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Eyebrow } from "../../ui/eyebrow";

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
        <Eyebrow as="div">Activity Date</Eyebrow>
        <CardTitle className="text-h3">
          {formatLongDate(submission.date)}
        </CardTitle>
      </CardHeader>
      {submission.description && (
        <CardContent>
          <Eyebrow as="div" className="mb-2">
            Description
          </Eyebrow>
          <p className="text-body-md text-muted-foreground">
            {submission.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
