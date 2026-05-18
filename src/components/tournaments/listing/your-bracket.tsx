import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { TournamentOverviewCard } from "../card/layout";

export function YourBracket({
  tournaments,
}: {
  tournaments: TournamentWithAuthority[];
}) {
  return (
    <section className="border-ink bg-paper-deep relative rounded-2xl border-2 p-5 shadow sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <Eyebrow color="sunset">Your bracket</Eyebrow>
          <h2 className="text-h2 text-foreground mt-1">
            {tournaments.length === 1 ? "Your tournament" : "Your tournaments"}
          </h2>
        </div>
        <Badge variant="success" className="gap-1">
          <Crown className="size-3" />
          {tournaments.length} on the card
        </Badge>
      </div>
      <div
        className={cn(
          "grid grid-cols-1 items-start gap-3 gap-y-6",
          tournaments.length > 1 && "md:grid-cols-2",
        )}
      >
        {tournaments.map((t) => (
          <TournamentOverviewCard key={t._id} data={t} />
        ))}
      </div>
    </section>
  );
}
