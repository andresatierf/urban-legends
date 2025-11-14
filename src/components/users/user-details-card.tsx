import type { FunctionReturnType } from "convex/server";
import { Settings, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { api } from "../../../convex/_generated/api";
import { DetailsCard } from "../details-card";
import { ManageRolesFormDialog } from "../form/manage-roles-form";
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";
import { RolesBadgeList } from "./roles-badge-list";

interface UserDetailsCardProps {
  data: FunctionReturnType<typeof api.users.getDetails>;
  className?: string;
}

export const UserDetailsCard = ({ data, className }: UserDetailsCardProps) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const details = useMemo(() => {
    if (!data) return [];

    return [
      { key: "name", value: data.user.name },
      { key: "email", value: data.user.email },
      {
        key: "roles",
        value: <RolesBadgeList roles={data.user.roleNames} className="py-2" />,
      },
      { key: "teams", value: `${data.statistics.teamCount}` },
      {
        key: "submissions",
        value: `${data.statistics.submissionCount} (${data.statistics.approvedSubmissionCount} approved)`,
      },
      { key: "points earned", value: `${data.statistics.totalPointsEarned}` },
    ];
  }, [data]);

  const actions = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "View Teams",
        icon: Users,
        condition: false && data.teams.length > 0,
        onClick: () => {
          // Could navigate to a teams list view
        },
      },
      {
        label: "View Submissions",
        icon: Trophy,
        condition: false && data.statistics.submissionCount > 0,
        onClick: () => {
          // Could navigate to submissions list view
        },
      },
      {
        label: "Manage Roles",
        icon: Settings,
        condition: data.canManageRoles,
        onClick: () => setAssignDialogOpen(true),
        separator: "before" as const,
      },
    ];
  }, [data]);

  if (!data) {
    return <DetailsCardSkeleton detailsCount={3} className={className} />;
  }

  return (
    <>
      <ManageRolesFormDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={data.user._id}
        userName={data.user.name}
        currentRoles={data.user.roleNames}
      />
      <DetailsCard
        title={data.user.name}
        details={details}
        actions={actions}
        className={className}
      />
    </>
  );
};
