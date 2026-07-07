import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Check,
  ExternalLink,
  Pencil,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";

import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { SectionHeader } from "@/components/section-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { UpsertChallengeFormDialog } from "./form";
import { ChallengeRosterDialog } from "./roster-dialog";

type ChallengeWithRoster = FunctionReturnType<
  typeof api.views.challenges.listByTournament
>[number];

type Props = {
  tournamentId: Id<"tournaments">;
};

export function ChallengesSection({ tournamentId }: Props) {
  const challenges = useQuery(api.views.challenges.listByTournament, {
    tournamentId,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"challenges"> | null>(null);
  const [rosterForId, setRosterForId] = useState<Id<"challenges"> | null>(null);
  const rosterFor = challenges?.find((c) => c._id === rosterForId) ?? null;

  return (
    <>
      <SectionHeader as="h2" title="Challenges" Icon={Target}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Create Challenge
        </Button>
      </SectionHeader>

      <UpsertChallengeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tournamentId={tournamentId}
      />
      {editing && (
        <UpsertChallengeFormDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          tournamentId={tournamentId}
          challenge={editing}
        />
      )}

      {rosterFor && (
        <ChallengeRosterDialog
          open
          onOpenChange={(o) => !o && setRosterForId(null)}
          challenge={rosterFor}
        />
      )}

      <ChallengeListBody
        challenges={challenges}
        onEdit={setEditing}
        onManageRoster={setRosterForId}
      />
    </>
  );
}

function ChallengeListBody({
  challenges,
  onEdit,
  onManageRoster,
}: {
  challenges: ChallengeWithRoster[] | undefined;
  onEdit: (challenge: Doc<"challenges">) => void;
  onManageRoster: (challengeId: Id<"challenges">) => void;
}) {
  if (challenges === undefined) {
    return <p className="text-body-md text-muted-foreground">Loading…</p>;
  }
  if (challenges.length === 0) {
    return (
      <p className="text-body-md text-muted-foreground">
        No challenges yet. Create one to award tournament-wide points.
      </p>
    );
  }
  return (
    <div className="grid gap-x-3 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge._id}
          challenge={challenge}
          onEdit={() => onEdit(challenge)}
          onManageRoster={() => onManageRoster(challenge._id)}
        />
      ))}
    </div>
  );
}

function ChallengeCard({
  challenge,
  onEdit,
  onManageRoster,
}: {
  challenge: ChallengeWithRoster;
  onEdit: () => void;
  onManageRoster: () => void;
}) {
  const isPending = challenge.state === "pending";
  const approve = useMutation(api.challenges.approve);
  const remove = useMutation(api.challenges.remove);
  const [approving, setApproving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const handleApprove = () => {
    setApproving(true);
    void tryMutate({
      fn: () => approve({ challengeId: challenge._id }),
      successToast: "Challenge approved",
      onFinally: () => setApproving(false),
    });
  };
  const handleDelete = () => {
    setRemoving(true);
    void tryMutate({
      fn: () => remove({ challengeId: challenge._id }),
      successToast: isPending
        ? "Challenge deleted"
        : "Challenge deleted and standings updated",
      onFinally: () => setRemoving(false),
    });
  };
  const deleteWarning = isPending
    ? "This Challenge is pending and has no impact on standings."
    : "This Challenge is approved. Deleting it will remove its awarded points from every team in the tournament.";
  return (
    <EdgeOverlay
      bottomLeft={
        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="shadow-sm"
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="grass"
                className="shadow-sm"
                onClick={handleApprove}
                disabled={approving}
              >
                <Check className="size-3.5" />
                Approve
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="shadow-sm"
                disabled={removing}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this Challenge?</AlertDialogTitle>
                <AlertDialogDescription>{deleteWarning}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
      bottomRight={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-sm"
            onClick={onManageRoster}
          >
            <Users className="size-3.5" />
            Roster
          </Button>
          <Button size="sm" asChild className="shadow-sm">
            <Link
              to="/challenges/$challengeId"
              params={{ challengeId: challenge._id }}
            >
              <ExternalLink className="size-3.5" />
              Details
            </Link>
          </Button>
        </div>
      }
    >
      <ComposedCard
        className="pb-2"
        title={challenge.description}
        badge={{
          variant: isPending ? "info" : "success",
          children: challenge.state,
        }}
      >
        <StatsGrid
          className="grid-cols-4"
          variant="strip"
          items={[
            { label: "Individual", value: challenge.individualAmount },
            { label: "Team", value: challenge.teamAmount },
            {
              label: "Threshold",
              value: `${Math.round(challenge.threshold * 100)}%`,
            },
            { label: "Roster", value: challenge.roster.length },
          ]}
        />
      </ComposedCard>
    </EdgeOverlay>
  );
}
