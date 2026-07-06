import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Pencil, Target, Trash2, Users } from "lucide-react";
import { useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
  const canEdit = challenge.state === "pending";
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
      successToast:
        challenge.state === "approved"
          ? "Challenge deleted and standings updated"
          : "Challenge deleted",
      onFinally: () => setRemoving(false),
    });
  };
  const deleteWarning =
    challenge.state === "approved"
      ? "This Challenge is approved. Deleting it will remove its awarded points from every team in the tournament."
      : "This Challenge is pending and has no impact on standings.";
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-body-md leading-tight">
          {challenge.description}
        </CardTitle>
        <Badge variant={canEdit ? "info" : "success"}>{challenge.state}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Individual</span>
          <span>{challenge.individualAmount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Team</span>
          <span>{challenge.teamAmount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Threshold</span>
          <span>{Math.round(challenge.threshold * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Roster</span>
          <span>
            {challenge.roster.length}{" "}
            {challenge.roster.length === 1 ? "participant" : "participants"}
          </span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onManageRoster}>
            <Users />
            Roster
          </Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil />
                Edit
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={approving}>
                <Check />
                Approve
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={removing}>
                <Trash2 />
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
      </CardContent>
    </Card>
  );
}
