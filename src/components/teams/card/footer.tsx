import { LogOut, Settings } from "lucide-react";

import type { ComposedCardAction } from "@/components/common/card/composed-card";

import type { TeamCardData } from "./types";

type Args = {
  data: TeamCardData;
  onLeave?: () => void;
  joinSlot?: React.ReactNode;
};

export function getTeamCardActions({
  data,
  onLeave,
  joinSlot,
}: Args): ComposedCardAction[] {
  const { team, memberCount, isUserMember, userRole } = data;

  const canLeave =
    userRole === "member" || (userRole === "captain" && memberCount === 1);

  if (isUserMember) {
    const actions: ComposedCardAction[] = [];
    if (canLeave && onLeave) {
      actions.push({
        label: "Leave",
        icon: <LogOut className="size-3.5" />,
        variant: "destructive",
        onClick: onLeave,
      });
    }
    actions.push({
      label: "Manage",
      icon: <Settings className="size-3.5" />,
      variant: "default",
      align: "end",
      to: "/teams/$teamId",
      params: { teamId: team._id },
    });
    return actions;
  }

  return [
    ...(joinSlot ? [{ slot: joinSlot }] : []),
    {
      label: "View",
      variant: "default",
      align: "end" as const,
      to: "/teams/$teamId",
      params: { teamId: team._id },
    },
  ];
}
