import { Link, useMatches } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const VARIANTS = [
  {
    label: "A · Immersive Cards",
    to: "/dev/tournament-listing-a",
  },
  {
    label: "B · Compact Rows",
    to: "/dev/tournament-listing-b",
  },
  {
    label: "C · Magazine Grid",
    to: "/dev/tournament-listing-c",
  },
] as const;

export function TournamentListingVariantNav() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  return (
    <nav className="bg-muted mb-6 flex items-center gap-1 rounded-lg p-1">
      {VARIANTS.map(({ label, to }) => (
        <Link
          key={to}
          to={to as never}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors",
            currentPath === to
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
