import { Settings } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailsCard } from "../details-card";
import { ManageRolesFormDialog } from "../form/manage-roles-form";
import { RolesBadgeList } from "./roles-badge-list";

type Props = {
  user: Doc<"users"> & { roles: string[] };
  className?: string;
};

export const UserDetailsCard = ({ user, className }: Props) => {
  const { isAdmin } = useUser();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const details = [
    { key: "name", value: user.name },
    { key: "email", value: user.email },
    {
      key: "roles",
      value: <RolesBadgeList roles={user.roles} className="py-2" />,
    },
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
      <ManageRolesFormDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={user._id}
        userName={user.name}
        currentRoles={user.roles}
      />
      <DetailsCard
        title={user.name}
        details={details}
        actions={actions}
        className={className}
      />
    </>
  );
};
