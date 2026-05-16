import { SectionHeader } from "@/components/section-header";
import { TournamentOverviewCard } from "@/components/tournaments/card/layout";

import { DEMO_TOURNAMENT_ITEMS } from "./tournament-workbench-fixtures";

export function TournamentSection() {
  return (
    <section className="mt-12">
      <SectionHeader
        as="h1"
        title="Tournament"
        description="The production tournament listing card across the 9-state matrix (active/upcoming/ended × no-team/member/captain)."
      />

      <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_TOURNAMENT_ITEMS.map((item) => (
          <div key={item.tournament._id}>
            <TournamentOverviewCard data={item.tournament} />
            <p className="text-muted-foreground mt-1 text-center text-[0.625rem]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
