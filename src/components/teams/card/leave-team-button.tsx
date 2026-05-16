"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { TeamCardData } from "./types";

type Props = {
  data: TeamCardData;
  onClick: () => void;
};

export function LeaveTeamButton({ data, onClick }: Props) {
  if (!data.isUserMember) return null;
  const canLeave =
    data.userRole === "member" ||
    (data.userRole === "captain" && data.memberCount === 1);
  if (!canLeave) return null;

  return (
    <Button
      variant="destructive"
      size="sm"
      className="shadow-sm"
      onClick={onClick}
    >
      <LogOut className="size-3.5" />
      Leave
    </Button>
  );
}
