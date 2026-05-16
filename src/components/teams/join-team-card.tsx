import { UpsertTeamFormDialog } from "@/components/form/upsert-team-form";

import { Card, CardContent } from "../ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "../ui/empty";

type Props = {
  first?: boolean;
  action?: React.ReactNode;
};

export function JoinTeamCard({ first, action }: Props) {
  return (
    <Card>
      <CardContent>
        <Empty className="gap-3 py-2!">
          <EmptyHeader>{first ? "No teams yet" : "Join a Team"}</EmptyHeader>
          <EmptyDescription>
            {first
              ? "Create a team to play in a tournament"
              : "You can join a team by selecting from the list below or you can create your own."}
          </EmptyDescription>
          <EmptyContent>{action ?? <UpsertTeamFormDialog />}</EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
