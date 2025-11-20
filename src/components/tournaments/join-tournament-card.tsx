import { UpsertTeamFormDialog } from "../form/upsert-team-form";
import { Card, CardContent } from "../ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "../ui/empty";

type Props = { first?: boolean };

export function JoinTournamentCard({ first }: Props) {
  return (
    <Card>
      <CardContent>
        <Empty className="gap-3 py-2!">
          <EmptyHeader>No tournaments yet</EmptyHeader>
          <EmptyDescription>
            {first
              ? "Please contact your tournament organizer to create a tournament"
              : "Join a team to start playing in tournaments or create your own."}
          </EmptyDescription>
          <EmptyContent>{!first && <UpsertTeamFormDialog />}</EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
