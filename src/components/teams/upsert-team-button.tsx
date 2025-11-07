import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UpsertTeamForm } from "./upsert-team-form";

type Props = {
  tournamentId: Id<"tournaments">;
};

export function UpsertTeamButton({ tournamentId }: Props) {
  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId } : "skip",
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create a Team{tournament && ` in ${tournament.name}`}
          </DialogTitle>
          <DialogDescription>
            Create a team {tournament && "for this tournament"} and invite
            members.
          </DialogDescription>
        </DialogHeader>
        <UpsertTeamForm tournamentId={tournamentId} />
      </DialogContent>
    </Dialog>
  );
}
