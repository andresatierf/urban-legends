import { UpsertTeamFormDialog } from "../form/upsert-team-form";
import { Card, CardContent } from "../ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "../ui/empty";

type Props = { first?: boolean };

export function JoinTeamCard({ first }: Props) {
  return (
    <Card variant="info">
      <CardContent>
        <Empty className="gap-3 py-2!">
          <EmptyHeader>Join a Team</EmptyHeader>
          <EmptyDescription>
            {first
              ? "Create a team to play in a tournament"
              : "You can join a team by selecting from the list below or you can create your own."}
          </EmptyDescription>
          <EmptyContent>
            <UpsertTeamFormDialog />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
