import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../convex/tournaments";
import { TournamentOverviewCard } from "./tournament-overview-card";
import { partitionTournaments } from "./utils";

export function TournamentListing({
  tournaments,
}: {
  tournaments: TournamentWithAuthority[];
}) {
  const { active, upcoming, ended } = partitionTournaments(tournaments);

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <TournamentSection
          dotClass="bg-emerald-500"
          label="Now playing"
          tournaments={active}
        />
      )}

      {upcoming.length > 0 && (
        <TournamentSection
          dotClass="bg-blue-500"
          label="Coming soon"
          tournaments={upcoming}
        />
      )}

      {ended.length > 0 && (
        <TournamentSection
          dotClass="bg-muted-foreground/40"
          label="Past tournaments"
          tournaments={ended}
        />
      )}
    </div>
  );
}

function TournamentSection({
  dotClass,
  label,
  tournaments,
}: {
  dotClass: string;
  label: string;
  tournaments: TournamentWithAuthority[];
}) {
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
          <TournamentOverviewCard key={t._id} tournament={t} />
        ))}
      </div>
    </section>
  );
}

export function TournamentListingSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, sectionIdx) => (
        <section key={sectionIdx} className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      ))}
    </div>
  );
}
