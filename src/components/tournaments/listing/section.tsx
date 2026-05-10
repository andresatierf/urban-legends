import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { TournamentOverviewCard } from "../card/layout";

type Props = {
  dotClass: string;
  label: string;
  tournaments: TournamentWithAuthority[];
};

export function TournamentSection({ dotClass, label, tournaments }: Props) {
  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", dotClass)}
        />
        {label}
      </h3>
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => (
          <TournamentOverviewCard key={t._id} data={t} />
        ))}
      </div>
    </section>
  );
}
