import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

import type { TournamentStatus } from "../../tournaments/utils";

export type StatusBandPalette = "vivid" | "semantic";

const PALETTES: Record<StatusBandPalette, Record<TournamentStatus, string>> = {
  vivid: {
    active: "bg-emerald-500 text-white",
    upcoming: "bg-blue-500 text-white",
    ended: "bg-muted-foreground text-white",
  },
  semantic: {
    active: "bg-primary text-primary-foreground",
    upcoming: "bg-muted text-muted-foreground",
    ended: "bg-secondary text-secondary-foreground",
  },
};

type Props = React.ComponentProps<"div"> & {
  status: TournamentStatus;
  palette?: StatusBandPalette;
  asChild?: boolean;
};

export function StatusBand({
  status,
  palette = "vivid",
  asChild = false,
  className,
  ...props
}: Props) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      className={cn(
        "flex items-center justify-between px-4 py-2",
        PALETTES[palette][status],
        className,
      )}
      {...props}
    />
  );
}
