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
  activity: Doc<"activities">;
};

export function DescriptionCard({ activity }: Props) {
  return (
    <Card>
      <CardHeader>
        <Eyebrow as="div">Activity Date</Eyebrow>
        <CardTitle>{formatLongDate(activity.date)}</CardTitle>
      </CardHeader>
      {activity.description && (
        <CardContent>
          <Eyebrow as="div" className="mb-2">
            Description
          </Eyebrow>
          <p className="text-body-md text-muted-foreground">
            {activity.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
