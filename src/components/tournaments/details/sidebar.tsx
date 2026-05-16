import { linkOptions } from "@tanstack/react-router";
import { Pencil, Swords, Trophy } from "lucide-react";
import { useState } from "react";

import type { Id } from "../../../../convex/_generated/dataModel";
import { UpsertTournamentFormDialog } from "../../form/upsert-tournament-form";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "../../ui/sidebar-card";
import { RulesCard } from "./rules-card";
import { TournamentTimeline } from "./timeline";
import type { TournamentDetails } from "./types";
import { YourTeamCard } from "./your-team-card";

type Props = {
  data: TournamentDetails;
  tournamentId: Id<"tournaments">;
};

export function Sidebar({ data, tournamentId }: Props) {
  const [editTournamentDialogOpen, setEditTournamentDialogOpen] =
    useState(false);

  const badges: SidebarCardBadge[] = [
    {
      label:
        data.status === "active"
          ? "Active"
          : data.status === "upcoming"
            ? "Upcoming"
            : "Ended",
      variant:
        data.status === "active"
          ? "success"
          : data.status === "upcoming"
            ? "info"
            : "neutral",
    },
  ];

  const stats: SidebarCardStat[] = [
    { label: "Teams", value: String(data.statistics.totalTeams) },
    { label: "Players", value: String(data.statistics.totalParticipants) },
  ];

  const actions: SidebarCardAction[] = [];
  if (data.canViewLeaderboard) {
    actions.push({
      label: "Leaderboard",
      icon: Trophy,
      link: linkOptions({
        to: "/tournaments/$tournamentId/leaderboard",
        params: { tournamentId },
      }),
    });
  }
  if (data.canEdit) {
    actions.push({
      label: "Edit Tournament",
      icon: Pencil,
      onClick: () => setEditTournamentDialogOpen(true),
    });
  }

  return (
    <>
      {data.canEdit && (
        <UpsertTournamentFormDialog
          open={editTournamentDialogOpen}
          onOpenChange={setEditTournamentDialogOpen}
          tournament={data.tournament}
        />
      )}

      <SidebarCard
        icon={Swords}
        badges={badges}
        title={data.tournament.name}
        description={data.tournament.description}
        stats={stats}
        actions={actions}
      >
        <TournamentTimeline data={data} />
      </SidebarCard>

      {data.userTeam && <YourTeamCard userTeam={data.userTeam} />}

      <RulesCard tournament={data.tournament} />
    </>
  );
}
