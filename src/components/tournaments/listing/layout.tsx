import { Crown } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { TournamentOverviewCard } from "../card/layout";
import { getTournamentStatus, type TournamentStatus } from "../utils";

type StatusFilter = TournamentStatus | "all";

type Props = {
  yours: TournamentWithAuthority[];
  discover: TournamentWithAuthority[];
};

export function TournamentListing({ yours, discover }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredDiscover = useMemo(
    () =>
      discover.filter((t) => {
        if (filter === "all") return true;
        return getTournamentStatus(t) === filter;
      }),
    [discover, filter],
  );

  const counts = useMemo(() => {
    const out: Record<StatusFilter, number> = {
      all: discover.length,
      active: 0,
      upcoming: 0,
      ended: 0,
    };
    for (const t of discover) {
      out[getTournamentStatus(t)] += 1;
    }
    return out;
  }, [discover]);

  const hasYours = yours.length > 0;
  const hasDiscover = discover.length > 0;

  return (
    <div className="space-y-8">
      {hasYours && (
        <section className="border-ink bg-paper-deep relative rounded-2xl border-2 p-5 shadow sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <Eyebrow color="sunset">Your bracket</Eyebrow>
              <h2 className="text-h2 text-foreground mt-1">
                {yours.length === 1 ? "Your tournament" : "Your tournaments"}
              </h2>
            </div>
            <Badge variant="success" className="gap-1">
              <Crown className="size-3" />
              {yours.length} on the card
            </Badge>
          </div>
          <div
            className={cn(
              "grid grid-cols-1 items-start gap-3 gap-y-6",
              yours.length > 1 && "md:grid-cols-2",
            )}
          >
            {yours.map((t) => (
              <TournamentOverviewCard key={t._id} data={t} />
            ))}
          </div>
        </section>
      )}

      {hasDiscover && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>Discover</Eyebrow>
              <h2 className="text-h2 text-foreground mt-1">
                {hasYours ? "More tournaments" : "Open tournaments"}
              </h2>
            </div>
            <FilterChips
              filter={filter}
              setFilter={setFilter}
              counts={counts}
            />
          </div>

          {filteredDiscover.length === 0 ? (
            <p className="border-ink-soft text-muted-foreground text-body-sm rounded-lg border-2 border-dashed py-8 text-center">
              No tournaments match this filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDiscover.map((t) => (
                <TournamentOverviewCard key={t._id} data={t} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function FilterChips({
  filter,
  setFilter,
  counts,
}: {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}) {
  const items: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "upcoming", label: "Upcoming" },
  ];
  if (counts.ended > 0) items.push({ key: "ended", label: "Ended" });

  return (
    <div className="border-ink bg-card flex rounded-lg border-2 p-0.5">
      {items.map(({ key, label }) => {
        const active = filter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "text-label-caps flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-paper-deep",
            )}
          >
            {label}
            <span
              className={cn(
                "text-body-sm rounded-sm px-1 font-mono",
                active
                  ? "bg-primary-foreground/10 text-primary-foreground"
                  : "text-muted-foreground bg-paper-deep",
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function TournamentListingSkeleton() {
  return (
    <div className="space-y-8">
      <section className="border-ink bg-paper-deep rounded-2xl border-2 p-5 shadow sm:p-6">
        <Skeleton className="mb-4 h-7 w-48" />
        <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="gap-0 py-0">
              <Skeleton className="h-9 w-full rounded-t-lg rounded-b-none" />
              <div className="flex flex-col gap-3 px-4 py-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0 py-0">
              <Skeleton className="h-9 w-full rounded-t-lg rounded-b-none" />
              <div className="flex flex-col gap-3 px-4 py-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
