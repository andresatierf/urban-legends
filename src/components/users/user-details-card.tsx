import { Settings } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AssignRoleDialog } from "../admin/assign-role-dialog";
import { RolesBadgeList } from "../admin/roles-badge-list";
import { DetailsCard } from "../details-card";

type Props = {
  user: Doc<"users"> & { roles: string[] };
  className?: string;
};

export const UserDetailsCard = ({ user, className }: Props) => {
  const { isAdmin } = useUser();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const details = [
    { key: "roles", value: <RolesBadgeList roles={user.roles} /> },
  ];
  const actions = [
    {
      label: "Manage Roles",
      icon: Settings,
      condition: isAdmin,
      onClick: () => setAssignDialogOpen(true),
    },
  ];
  if (user === undefined) return null; // TODO: Add skeleton

  return (
    <>
      <AssignRoleDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={user._id}
        userName={user.name}
        currentRoles={user.roles}
      />
      <DetailsCard
        title={user.email}
        details={details}
        actions={actions}
        className={className}
      />
    </>
  );
};
