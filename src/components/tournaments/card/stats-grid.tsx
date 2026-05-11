import { Clock, Trophy, Users } from "lucide-react";

import { StatsGrid as CommonStatsGrid } from "../../common/card/stats-grid";
import {
  type TournamentStatus,
  daysUntil,
  getTournamentStatus,
} from "../utils";
import type { TournamentCardData } from "./types";

const DAYS_LABEL: Record<TournamentStatus, string> = {
  active: "Left",
  upcoming: "Until start",
  ended: "Ended",
};

export function StatsGrid({ data }: { data: TournamentCardData }) {
  const status = getTournamentStatus(data);
  const { authority, teamCount } = data;

  let daysValue: string | number = "—";
  if (status === "active") daysValue = `${daysUntil(data.endDate)}d`;
  else if (status === "upcoming") daysValue = `${daysUntil(data.startDate)}d`;

  return (
    <CommonStatsGrid
      variant="tiles"
      items={[
        {
          icon: Users,
          value: teamCount,
          label: teamCount === 1 ? "Team" : "Teams",
        },
        { icon: Clock, value: daysValue, label: DAYS_LABEL[status] },
        {
          icon: Trophy,
          value: authority.team ? authority.team.points : "—",
          label: "Points",
        },
      ]}
    />
  );
}
