import { ComposedCardHeader } from "@/components/common/card/composed-card";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import {
  getTournamentStatus,
  STATUS_LABEL,
  type TournamentStatus,
} from "../utils";
import type { TournamentCardData } from "./types";

const STATUS_VARIANT: Record<TournamentStatus, "success" | "info" | "neutral"> =
  {
    active: "success",
    upcoming: "info",
    ended: "neutral",
  };

export function StatusHeader({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);

  return (
    <ComposedCardHeader
      badge={{
        variant: STATUS_VARIANT[status],
        children: STATUS_LABEL[status],
      }}
    >
      <span className="text-mute text-label-caps">
        {format(data.startDate, "long")} – {format(data.endDate, "long")}
      </span>
      <h3 className="font-heading m-0 truncate text-base font-extrabold">
        {data.name}
      </h3>
    </ComposedCardHeader>
  );
}
