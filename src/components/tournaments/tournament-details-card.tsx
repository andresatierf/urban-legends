import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Pencil, Trash2, Trophy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DetailsCard } from "@/components/details-card";
import { DetailsCardSkeleton } from "@/components/ui/details-card-skeleton";
import { api } from "../../../convex/_generated/api";
import { UpsertTournamentFormDialog } from "../form/upsert-tournament-form";
import { getStatusBadge } from "./utils";

interface TournamentDetailsCardProps {
  data?: FunctionReturnType<typeof api.tournaments.getDetails>;
  className?: string;
}

export function TournamentDetailsCard({
  data,
  className,
}: TournamentDetailsCardProps) {
  const [editTournamentDialogOpen, setEditTournamentDialogOpen] =
    useState(false);

  const deleteTournament = useMutation(api.tournaments.remove);

  const handleDeleteTournament = useCallback(async () => {
    if (!data) return;

    try {
      await deleteTournament({ tournamentId: data.tournament._id });
      toast.success("Tournament deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete tournament",
      );
    }
  }, [data, deleteTournament]);

  const details = useMemo(() => {
    if (!data) return [];

    const baseDetails = [
      { key: "status", value: getStatusBadge(data.tournament) },
      { key: "startDate", value: data.tournament.startDate },
      { key: "endDate", value: data.tournament.endDate },
      { key: "Teams", value: `${data.statistics.totalTeams}` },
      { key: "Participants", value: `${data.statistics.totalParticipants}` },
      {
        key: "Avg Team Size",
        value: data.statistics.averageTeamSize.toFixed(1),
      },
    ];

    // Add user's team if they have one
    if (data.userTeam) {
      baseDetails.push({
        key: "Your Team",
        value: data.userTeam.name,
      });
    }

    return baseDetails;
  }, [data]);

  const actions = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "View Leaderboard",
        href: `/tournaments/${data.tournament._id}/leaderboard`,
        icon: Trophy,
        condition: data.canViewLeaderboard,
        external: true,
        separator: "after" as const,
      },
      {
        label: "Edit Tournament",
        onClick: () => setEditTournamentDialogOpen(true),
        icon: Pencil,
        condition: data.canEdit,
      },
      {
        label: "Delete tournament",
        onClick: handleDeleteTournament,
        icon: Trash2,
        condition: data.canDelete,
        separator: "before" as const,
      },
    ];
  }, [data, handleDeleteTournament]);

  if (!data) {
    return <DetailsCardSkeleton detailsCount={4} className={className} />;
  }

  return (
    <div>
      <UpsertTournamentFormDialog
        open={editTournamentDialogOpen}
        onOpenChange={setEditTournamentDialogOpen}
        tournament={data.tournament}
      />
      <DetailsCard
        title={data.tournament.name}
        description={data.tournament.description}
        details={details}
        actions={actions}
        className={className}
      />
    </div>
  );
}
