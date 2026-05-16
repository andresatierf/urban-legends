import { SectionHeader } from "@/components/section-header";
import { TournamentOverviewCard } from "@/components/tournaments/card";

import { VariantMatrix } from "../shells/variant-matrix";
import {
  PLAYER_CONTEXTS,
  PLAYER_CONTEXT_LABELS,
  TOURNAMENT_STATUSES,
  getTournamentDemoItem,
} from "./fixtures";

export function TournamentSection() {
  return (
    <section className="mt-12">
      <SectionHeader
        as="h1"
        title="Tournament"
        description="The production tournament listing card across the 9-state matrix (active/upcoming/ended × no-team/member/captain)."
      />

      <div className="mt-8">
        <VariantMatrix
          variants={TOURNAMENT_STATUSES}
          columns={PLAYER_CONTEXTS}
          columnLabel={(ctx) => PLAYER_CONTEXT_LABELS[ctx]}
          renderCell={(status, ctx) => {
            const item = getTournamentDemoItem(status, ctx);
            if (!item) return null;
            return <TournamentOverviewCard data={item.tournament} />;
          }}
        />
      </div>
    </section>
  );
}
