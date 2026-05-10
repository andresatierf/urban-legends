import { Link } from "@tanstack/react-router";

import { useActiveRoute } from "@/hooks/useActiveRoute";
import { cn } from "@/lib/utils";

const DEMO_PAGES = [
  { to: "/dev/button-demo", label: "Buttons" },
  { to: "/dev/card-demo", label: "Cards" },
  { to: "/dev/dashboard-variant-a", label: "Dashboard A" },
  { to: "/dev/dashboard-variant-b", label: "Dashboard B" },
  { to: "/dev/dashboard-variant-c", label: "Dashboard C" },
] as const;

export function DemoPageSwitcher() {
  const { isActive } = useActiveRoute();

  return (
    <nav
      aria-label="Demo pages"
      className="bg-muted text-muted-foreground inline-flex h-8 w-fit items-center gap-0.5 rounded-lg p-[3px]"
    >
      {DEMO_PAGES.map(({ to, label }) => {
        const active = isActive(to, true);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "hover:text-foreground inline-flex h-full items-center justify-center rounded-md border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
              active && "bg-background text-foreground shadow-sm",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
