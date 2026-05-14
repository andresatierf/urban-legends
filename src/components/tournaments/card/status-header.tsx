import { useFormattedDate } from "@/hooks/useFormattedDate";

import { Eyebrow } from "../../ui/eyebrow";
import { type RibbonColor, RibbonBanner } from "../../ui/ribbon-banner";
import {
  type TournamentStatus,
  STATUS_LABEL,
  getTournamentStatus,
} from "../utils";
import type { TournamentCardData } from "./types";

const STATUS_RIBBON_COLOR: Record<TournamentStatus, RibbonColor> = {
  active: "sunset",
  upcoming: "sky",
  ended: "mute",
};

export function StatusHeader({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);

  return (
    <div className="pt-3 pb-1">
      <RibbonBanner
        label={STATUS_LABEL[status]}
        color={STATUS_RIBBON_COLOR[status]}
        small
      />
      <Eyebrow as="div" className="text-center">
        {format(data.startDate, "long")} – {format(data.endDate, "long")}
      </Eyebrow>
    </div>
  );
}
