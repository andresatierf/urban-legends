import { UpsertTeamFormButton } from "../form/upsert-team-form-button";
import { Card, CardContent } from "../ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "../ui/empty";

export function JoinTeamCard() {
  return (
    <Card variant="info">
      <CardContent>
        <Empty className="gap-3 py-2!">
          <EmptyHeader>Join a Team</EmptyHeader>
          <EmptyDescription>
            You can join a team by selecting from the list below or you can
            create your own.
          </EmptyDescription>
          <EmptyContent>
            <UpsertTeamFormButton />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
