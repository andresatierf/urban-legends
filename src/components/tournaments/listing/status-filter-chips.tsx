import { cn } from "@/lib/utils";

import type { StatusCounts, StatusFilter } from "./types";

const ITEMS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
];

export function StatusFilterChips({
  filter,
  setFilter,
  counts,
}: {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  counts: StatusCounts;
}) {
  const items =
    counts.ended > 0
      ? [...ITEMS, { key: "ended" as const, label: "Ended" }]
      : ITEMS;

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
