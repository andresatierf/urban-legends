import { useMemo, useState } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { TournamentOverviewCard } from "../card/layout";
import { getTournamentStatus } from "../utils";
import { StatusFilterChips } from "./status-filter-chips";
import type { StatusCounts, StatusFilter } from "./types";

export function Discover({
  tournaments,
  title,
}: {
  tournaments: TournamentWithAuthority[];
  title: string;
}) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () =>
      tournaments.filter((t) => {
        if (filter === "all") return true;
        return getTournamentStatus(t) === filter;
      }),
    [tournaments, filter],
  );

  const counts = useMemo<StatusCounts>(() => {
    const out: StatusCounts = {
      all: tournaments.length,
      active: 0,
      upcoming: 0,
      ended: 0,
    };
    for (const t of tournaments) {
      out[getTournamentStatus(t)] += 1;
    }
    return out;
  }, [tournaments]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Discover</Eyebrow>
          <h2 className="text-h2 text-foreground mt-1">{title}</h2>
        </div>
        <StatusFilterChips
          filter={filter}
          setFilter={setFilter}
          counts={counts}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="border-ink-soft text-muted-foreground text-body-sm rounded-lg border-2 border-dashed py-8 text-center">
          No tournaments match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TournamentOverviewCard key={t._id} data={t} />
          ))}
        </div>
      )}
    </section>
  );
}
