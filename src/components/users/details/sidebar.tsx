import { CheckCircle, Settings, Trophy, Users } from "lucide-react";
import { useState } from "react";

import { ManageRolesFormDialog } from "@/components/users/form";

import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardStat,
} from "../../ui/sidebar-card";
import { ProfileCard } from "./profile-card";
import type { UserDetails } from "./types";

export function Sidebar({ data }: { data: UserDetails }) {
  const { user, statistics, canManageRoles } = data;
  const [manageRolesOpen, setManageRolesOpen] = useState(false);

  const approvalRate =
    statistics.activityCount > 0
      ? Math.round(
          (statistics.approvedActivityCount / statistics.activityCount) * 100,
        )
      : null;

  const stats: SidebarCardStat[] = [
    {
      icon: Trophy,
      iconColor: "text-warning",
      label: "Points",
      value: statistics.totalPointsEarned.toLocaleString(),
    },
    {
      icon: CheckCircle,
      iconColor: "text-success",
      label: "Approved",
      value: `${statistics.approvedActivityCount}/${statistics.activityCount}`,
    },
    {
      icon: Users,
      iconColor: "text-info",
      label: "Teams",
      value: String(statistics.teamCount),
    },
    {
      icon: CheckCircle,
      iconColor: "text-primary",
      label: "Approval",
      value: approvalRate === null ? "—" : `${approvalRate}%`,
    },
  ];

  const actions: SidebarCardAction[] = [];
  if (canManageRoles) {
    actions.push({
      label: "Manage Roles",
      icon: Settings,
      onClick: () => setManageRolesOpen(true),
    });
  }

  return (
    <>
      {canManageRoles && (
        <ManageRolesFormDialog
          open={manageRolesOpen}
          onOpenChange={setManageRolesOpen}
          userId={user._id}
          userName={user.name}
          currentRoles={user.roleNames}
        />
      )}

      <ProfileCard data={data} />

      <SidebarCard title="By the numbers" stats={stats} actions={actions} />
    </>
  );
}
