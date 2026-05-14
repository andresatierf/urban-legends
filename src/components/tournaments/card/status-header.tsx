import { useFormattedDate } from "@/hooks/useFormattedDate";

import { Badge } from "../../ui/badge";
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
    <header className="border-ink bg-paper-deep flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-[0.15rem]">
        <span className="text-mute text-label-caps">
          {format(data.startDate, "long")} – {format(data.endDate, "long")}
        </span>
        <h3 className="font-heading m-0 truncate text-base font-extrabold">
          {data.name}
        </h3>
      </div>
      <Badge variant={STATUS_VARIANT[status]} size="default">
        {STATUS_LABEL[status]}
      </Badge>
    </header>
  );
}
