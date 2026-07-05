import { useQuery } from "convex/react";
import { Pencil, Target } from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { UpsertChallengeFormDialog } from "./form";

type Props = {
  tournamentId: Id<"tournaments">;
};

export function ChallengesSection({ tournamentId }: Props) {
  const challenges = useQuery(api.views.challenges.listByTournament, {
    tournamentId,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"challenges"> | null>(null);

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

      {challenges === undefined ? (
        <p className="text-body-md text-muted-foreground">Loading…</p>
      ) : challenges.length === 0 ? (
        <p className="text-body-md text-muted-foreground">
          No challenges yet. Create one to award tournament-wide points.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge._id}
              challenge={challenge}
              onEdit={() => setEditing(challenge)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ChallengeCard({
  challenge,
  onEdit,
}: {
  challenge: Doc<"challenges">;
  onEdit: () => void;
}) {
  const canEdit = challenge.state === "pending";
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
        {canEdit && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
