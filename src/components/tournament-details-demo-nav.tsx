import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const VARIANTS = [
  { href: "/dev/tournament-details-a", label: "A — Dashboard" },
  { href: "/dev/tournament-details-b", label: "B — Magazine" },
  { href: "/dev/tournament-details-c", label: "C — Sidebar" },
] as const;

export function TournamentDetailsDemoNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="bg-muted/50 mb-6 flex flex-wrap gap-1 rounded-lg p-1">
      {VARIANTS.map(({ href, label }) => (
        <Link
          key={href}
          to={href as "/dev/tournament-details-a"}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === href
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
