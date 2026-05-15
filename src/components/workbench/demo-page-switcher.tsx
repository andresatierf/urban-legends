import { Link } from "@tanstack/react-router";

import { useActiveRoute } from "@/hooks/useActiveRoute";
import { cn } from "@/lib/utils";

const DEMO_PAGES = [
  { to: "/dev/tokens", label: "Tokens" },
  { to: "/dev/button-demo", label: "Buttons" },
  { to: "/dev/card-demo", label: "Cards" },
  { to: "/dev/inputs", label: "Inputs" },
  { to: "/dev/badges", label: "Badges" },
  { to: "/dev/table", label: "Table" },
  { to: "/dev/submissions-hub-a", label: "Submissions A" },
  { to: "/dev/submissions-hub-b", label: "Submissions B" },
  { to: "/dev/submissions-hub-c", label: "Submissions C" },
] as const;

export function DemoPageSwitcher() {
  const { isActive } = useActiveRoute();

  return (
    <nav
      aria-label="Demo pages"
      className="bg-muted text-muted-foreground flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg p-[3px]"
    >
      {DEMO_PAGES.map(({ to, label }) => {
        const active = isActive(to, true);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "hover:text-foreground inline-flex h-7 items-center justify-center rounded-md border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
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
