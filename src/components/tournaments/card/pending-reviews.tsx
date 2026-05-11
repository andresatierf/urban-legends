import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

import type { TournamentCardData } from "./types";

export function PendingReviews({ data }: { data: TournamentCardData }) {
  const { canReview, pendingReviewCount } = data.authority;
  if (!canReview || pendingReviewCount <= 0) return null;

  return (
    <Link
      to="/reviewer"
      className="bg-primary/10 text-primary hover:bg-primary/15 flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium transition-colors"
    >
      <Trophy className="h-3.5 w-3.5" />
      {pendingReviewCount} pending review
      {pendingReviewCount !== 1 && "s"}
    </Link>
  );
}
