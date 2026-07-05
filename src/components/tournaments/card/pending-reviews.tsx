import { Link } from "@tanstack/react-router";
import { ArrowRight, Trophy } from "lucide-react";

import type { TournamentCardData } from "./types";

export function PendingReviews({ data }: { data: TournamentCardData }) {
  const { canReview, pendingReviewCount } = data.authority;
  if (!canReview || pendingReviewCount <= 0) return null;

  return (
    <Link
      to="/reviewer"
      className="border-ink bg-primary text-primary-foreground hover:bg-primary/90 group/queue flex items-stretch gap-0 overflow-hidden rounded-xl border-2 shadow-sm transition-colors"
    >
      <div className="border-ink/20 bg-primary/80 flex items-center justify-center border-r px-3">
        <Trophy className="size-4" strokeWidth={2.5} />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
        <span className="text-metric leading-none tabular-nums">
          {pendingReviewCount}
        </span>
        <span className="text-label-caps font-bold">
          {pendingReviewCount === 1
            ? "activity to review"
            : "activities to review"}
        </span>
      </div>
      <div className="border-ink/20 flex items-center border-l px-3 transition-transform group-hover/queue:translate-x-0.5">
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </div>
    </Link>
  );
}
