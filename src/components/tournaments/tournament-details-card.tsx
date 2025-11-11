import { useMutation } from "convex/react";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DetailsCard } from "@/components/details-card";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { UpsertTournamentFormButton } from "../form/upsert-tournament-form-button";
import { getStatusBadge } from "./utils";

type Props = {
  tournament: Doc<"tournaments">;
  teams: Doc<"teams">[];
  enableActions?: boolean;
  className?: string;
};

export function TournamentDetailsCard({ tournament, teams, className }: Props) {
  const { isAdmin } = useUser();
  const [editTournamentDialogOpen, setEditTournamentDialogOpen] =
    useState(false);

  const deleteTournament = useMutation(api.tournaments.remove);

  const details = [
    { key: "status", value: getStatusBadge(tournament) },
    { key: "startDate", value: tournament.startDate },
    { key: "endDate", value: tournament.endDate },
    { key: "Teams", value: `${teams?.length ?? "0"}` },
  ];

  const handleDeleteTournament = useCallback(async () => {
    try {
      await deleteTournament({ tournamentId: tournament._id });
      toast.success("Tournament deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete tournament",
      );
    }
  }, [tournament._id, deleteTournament]);

  const actions = [
    {
      label: "Edit Tournament",
      onClick: () => setEditTournamentDialogOpen(true),
      icon: Pencil,
      condition: isAdmin,
      external: true,
    },
    {
      label: "Delete tournament",
      onClick: handleDeleteTournament,
      icon: Trash2,
      condition: isAdmin,
      separator: "before" as const,
    },
  ];

  if (tournament === undefined) return null; // TODO: Add skeleton

  return (
    <div>
      <UpsertTournamentFormButton
        open={editTournamentDialogOpen}
        onOpenChange={setEditTournamentDialogOpen}
        tournament={tournament}
      />
      <DetailsCard
        title={tournament.name}
        description={tournament.description}
        details={details}
        actions={actions}
        className={className}
      />
    </div>
  );
}
