import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Check, Pencil, Target, Trash2, Users } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "@/components/ui/sidebar-card";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import { UpsertChallengeFormDialog } from "../form";
import { ChallengeRosterDialog } from "../roster-dialog";
import type { ChallengeDetailsData } from "./types";

function formatChallengeDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Sidebar({ data }: { data: ChallengeDetailsData }) {
  const { challenge, canManage } = data;
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const approve = useMutation(api.challenges.approve);
  const remove = useMutation(api.challenges.remove);

  const isPending = challenge.state === "pending";
  const isApproved = challenge.state === "approved";

  const badges: SidebarCardBadge[] = [
    {
      label: challenge.state,
      variant: isApproved ? "success" : "info",
    },
  ];

  const stats: SidebarCardStat[] = [
    { label: "Date", value: formatChallengeDate(challenge.date) },
    { label: "Individual", value: `${challenge.individualAmount}` },
    { label: "Team", value: `${challenge.teamAmount}` },
    { label: "Threshold", value: `${Math.round(challenge.threshold * 100)}%` },
    { label: "Roster", value: `${data.roster.length}` },
  ];

  const handleApprove = () => {
    setIsMutating(true);
    void tryMutate({
      fn: () => approve({ challengeId: challenge._id }),
      successToast: "Challenge approved",
      onFinally: () => setIsMutating(false),
    });
  };

  const handleDelete = () => {
    setIsMutating(true);
    void tryMutate({
      fn: () => remove({ challengeId: challenge._id }),
      successToast: isApproved
        ? "Challenge deleted and standings updated"
        : "Challenge deleted",
      onSuccess: () => {
        void navigate({
          to: "/tournaments/$tournamentId",
          params: { tournamentId: challenge.tournamentId },
        });
      },
      onFinally: () => setIsMutating(false),
    });
  };

  const actions: SidebarCardAction[] = [];
  if (canManage) {
    actions.push({
      label: "Roster",
      icon: Users,
      onClick: () => setRosterOpen(true),
    });
    if (isPending) {
      actions.push({
        label: "Edit",
        icon: Pencil,
        onClick: () => setEditOpen(true),
      });
      actions.push({
        label: "Approve",
        icon: Check,
        variant: "default",
        disabled: isMutating,
        onClick: handleApprove,
      });
    }
    actions.push({
      label: "Delete",
      icon: Trash2,
      variant: "outline",
      disabled: isMutating,
      onClick: () => setDeleteOpen(true),
    });
  }

  const deleteWarning = isApproved
    ? "This Challenge is approved. Deleting it will remove its awarded points from every team in the tournament."
    : "This Challenge is pending and has no impact on standings.";

  return (
    <>
      {canManage && isPending && (
        <UpsertChallengeFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          tournamentId={challenge.tournamentId}
          challenge={challenge}
        />
      )}
      {canManage && (
        <ChallengeRosterDialog
          open={rosterOpen}
          onOpenChange={setRosterOpen}
          challenge={{ ...challenge, roster: data.roster }}
        />
      )}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Challenge?</AlertDialogTitle>
            <AlertDialogDescription>{deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarCard
        icon={Target}
        badges={badges}
        title="Challenge"
        stats={stats}
        actions={actions.length > 0 ? actions : undefined}
      />
    </>
  );
}
