import { useMutation } from "convex/react";
import { Crown, DoorOpen, Mail, Users } from "lucide-react";

import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { getInitials } from "../../users/utils";
import type { TeamDetails } from "./types";

export function MemberRoster({ data }: { data: TeamDetails }) {
  const { team, members, canManageMembers } = data;
  const { user } = useUser();
  const removeMember = useMutation(api.teams.removeMember);

  const handleRemove = (userId: Id<"users">) => {
    void tryMutate({
      fn: () => removeMember({ teamId: team._id, userId }),
      successToast: "Member removed",
      defaultFailureToast: "Failed to remove member",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
          <AvatarGroup>
            {members.slice(0, 4).map((m) => (
              <Avatar key={m._id} size="sm">
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <AvatarGroupCount>+{members.length - 4}</AvatarGroupCount>
            )}
          </AvatarGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-border divide-y">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member.name}</span>
                    <Badge
                      variant={
                        member.memberRole === "captain"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {member.memberRole === "captain" && (
                        <Crown className="h-3 w-3" />
                      )}
                      {member.memberRole}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </div>
                </div>
              </div>
              {canManageMembers &&
                member.memberRole !== "captain" &&
                member._id !== user?._id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member._id)}
                  >
                    <DoorOpen className="h-4 w-4" />
                    Remove
                  </Button>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
