import type { Doc } from "../../../convex/_generated/dataModel";
import { InviteMemberFormDialog } from "../form/invite-member-form";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "../ui/empty";

type Props = {
  team: Doc<"teams">;
  isCaptain: boolean;
};

export function InviteMemberCard({ team, isCaptain }: Props) {
  return (
    <Card>
      <CardContent>
        <Empty className="gap-3 py-2!">
          <EmptyHeader>No Members</EmptyHeader>
          <EmptyDescription>
            {isCaptain
              ? "You can invite people to join your team."
              : "Ask the team captain to invite members."}
          </EmptyDescription>
          {isCaptain && (
            <EmptyContent>
              <InviteMemberFormDialog teamId={team._id}>
                <Button>Invite a Member</Button>
              </InviteMemberFormDialog>
            </EmptyContent>
          )}
        </Empty>
      </CardContent>
    </Card>
  );
}
