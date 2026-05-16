import { Link } from "@tanstack/react-router";

import { useActiveRoute } from "@/hooks/useActiveRoute";
import { cn } from "@/lib/utils";

import { GROUPED_WORKBENCH_ENTRIES } from "./registry";

export function WorkbenchSidebar() {
  const { isActive } = useActiveRoute();

  return (
    <nav aria-label="Workbench entries" className="space-y-4">
      {[...GROUPED_WORKBENCH_ENTRIES.entries()].map(([group, entries]) => (
        <div key={group}>
          <h3 className="text-label-caps text-muted-foreground mb-1 px-2">
            {group}
          </h3>
          <ul className="space-y-0.5">
            {entries.map((entry) => {
              const active = isActive(entry.path, true);
              return (
                <li key={entry.path}>
                  <Link
                    to={entry.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-body-sm hover:bg-muted block rounded-md px-2 py-1.5 font-medium transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {entry.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
