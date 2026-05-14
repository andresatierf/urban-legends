import { ArrowRight, Edit } from "lucide-react";

import type { ComposedCardAction } from "@/components/common/card/composed-card";

import type { TournamentCardData } from "./types";

export function getTournamentCardActions(
  data: TournamentCardData,
): ComposedCardAction[] {
  const { authority } = data;
  const actions: ComposedCardAction[] = [];

  if (authority.canManage) {
    actions.push({
      label: "Manage",
      icon: <Edit className="h-3.5 w-3.5" />,
      variant: "secondary",
      to: `/admin/tournaments?edit=${data._id}` as never,
    });
  }

  actions.push({
    label: authority.team ? "View" : "Browse Teams",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    iconPosition: "end",
    align: "end",
    to: "/tournaments/$tournamentId",
    params: { tournamentId: data._id },
  });

  return actions;
}
