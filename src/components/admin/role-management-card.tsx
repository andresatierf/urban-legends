"use client";

import { useQuery } from "convex/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AssignRoleDialog } from "./assign-role-dialog";
import { RemoveRoleDialog } from "./remove-role-dialog";
import { RolesBadgeList } from "./roles-badge-list";

type Props = {
  userId: Id<"users">;
  userName: string;
  currentRoles: string[];
};

export function RoleManagementCard({ userId, userName, currentRoles }: Props) {
  const currentUser = useQuery(api.users.current);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<string | null>(null);

  const handleRemoveClick = (roleName: string) => {
    setRoleToRemove(roleName);
    setRemoveDialogOpen(true);
  };

  const isSelf = currentUser?._id === userId;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Roles</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignDialogOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Manage Roles
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RolesBadgeList
            roles={currentRoles}
            editable
            onRemove={handleRemoveClick}
          />
        </CardContent>
      </Card>

      <AssignRoleDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={userId}
        userName={userName}
        currentRoles={currentRoles}
      />

      {roleToRemove && (
        <RemoveRoleDialog
          open={removeDialogOpen}
          onOpenChange={(open) => {
            setRemoveDialogOpen(open);
            if (!open) setRoleToRemove(null);
          }}
          userId={userId}
          userName={userName}
          roleName={roleToRemove}
          isSelf={isSelf}
          currentUserId={userId}
        />
      )}
    </>
  );
}
