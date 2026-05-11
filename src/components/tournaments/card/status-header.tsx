import { useFormattedDate } from "@/hooks/useFormattedDate";

import { StatusBand } from "../../common/card/status-band";
import { STATUS_LABEL, getTournamentStatus } from "../utils";
import type { TournamentCardData } from "./types";

export function StatusHeader({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);

  return (
    <StatusBand
      status={status}
      palette="semantic"
      className="flex-wrap gap-x-2 gap-y-0.5 rounded-t-lg py-2.5"
    >
      <span className="text-xs font-semibold tracking-wider uppercase">
        {STATUS_LABEL[status]}
      </span>
      <span className="text-xs whitespace-nowrap">
        {format(data.startDate, "long")} – {format(data.endDate, "long")}
      </span>
    </StatusBand>
  );
}
