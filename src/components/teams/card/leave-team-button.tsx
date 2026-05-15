"use client";

import { useMutation } from "convex/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { TeamCardData } from "./types";

export function LeaveTeamButton({ data }: { data: TeamCardData }) {
  const leaveTeam = useMutation(api.teams.leaveTeam);

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
      onClick={() =>
        void tryMutate({
          fn: () => leaveTeam({ teamId: data.team._id }),
          successToast: "Successfully left the team",
          defaultFailureToast: "Failed to leave team",
        })
      }
    >
      <LogOut className="size-3.5" />
      Leave
    </Button>
  );
}
