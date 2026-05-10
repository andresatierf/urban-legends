import { cn } from "@/lib/utils";

import type { Doc } from "../../../../convex/_generated/dataModel";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

type Props = {
  tournaments: Doc<"tournaments">[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

export function FilterBar({
  tournaments,
  activeFilter,
  onFilterChange,
}: Props) {
  if (tournaments.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterChip
        active={activeFilter === "all"}
        onClick={() => onFilterChange("all")}
      >
        All tournaments
      </FilterChip>
      {tournaments.map((t) => (
        <FilterChip
          key={t._id}
          active={activeFilter === t._id}
          onClick={() => onFilterChange(t._id)}
        >
          {t.name}
        </FilterChip>
      ))}
    </div>
  );
}
