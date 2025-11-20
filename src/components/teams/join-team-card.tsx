import type { Id } from "../../../convex/_generated/dataModel";
import { UpsertTeamFormDialog } from "../form/upsert-team-form";
import { Card, CardContent } from "../ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "../ui/empty";

type Props = {
  tournamentId?: Id<"tournaments">;
  first?: boolean;
};

export function JoinTeamCard({ tournamentId, first }: Props) {
  return (
    <Card>
      <CardContent>
        <Empty className="gap-3 py-2!">
          <EmptyHeader>
            {tournamentId || first ? "No teams yet" : "Join a Team"}
          </EmptyHeader>
          <EmptyDescription>
            {tournamentId
              ? "Be the first to create a team for this tournament!"
              : first
                ? "Create a team to play in a tournament"
                : "You can join a team by selecting from the list below or you can create your own."}
          </EmptyDescription>
          <EmptyContent>
            <UpsertTeamFormDialog tournamentId={tournamentId} />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
