import { Crown, DoorOpen, Mail, User } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";

type Props = {
  member: Doc<"users">;
  memberRole: "captain" | "member";
  canRemove?: boolean;
  onRemove?: () => void;
};

export function TeamMemberCard({
  member,
  memberRole,
  canRemove,
  onRemove,
}: Props) {
  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-2 xs:gap-16">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 font-semibold text-base leading-none tracking-tight">
              <User className="h-4 w-4" />
              {member.name}
            </CardTitle>
            <Badge variant={memberRole === "captain" ? "default" : "secondary"}>
              {memberRole === "captain" && <Crown className="h-3 w-3" />}
              {memberRole}
            </Badge>
          </div>
          <CardDescription className="mt-2">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {member.email}
            </div>
          </CardDescription>
        </div>
        {canRemove && (
          <div className="flex gap-2 xs:self-auto self-end">
            <Button
              color="destructive"
              size="icon"
              onClick={onRemove}
              aria-label="Remove member"
            >
              <DoorOpen />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
