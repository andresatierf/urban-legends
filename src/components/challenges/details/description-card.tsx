import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ChallengeDetailsData } from "./types";

export function DescriptionCard({ data }: { data: ChallengeDetailsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-body-md">Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-body-md whitespace-pre-wrap">
          {data.challenge.description}
        </p>
      </CardContent>
    </Card>
  );
}
