import type { FunctionReturnType } from "convex/server";

import type { ReviewItem } from "@/components/submissions/review/types";
import { toUserWithRoles } from "@/components/users/transforms";

import type { api } from "../../convex/_generated/api";

type ListForReviewPage = NonNullable<
  FunctionReturnType<typeof api.role.reviewer.listForReview>
>["page"];

export function convertPaginatedToReviewItems(
  page: ListForReviewPage | undefined,
): ReviewItem[] {
  if (!page) return [];

  return page.map((item) => {
    if (item.type === "individual") {
      return {
        type: "individual" as const,
        data: {
          submission: item.submission,
          state: item.submission.state,
          team: item.team,
          tournament: item.tournament,
          submitter: toUserWithRoles(item.submitter),
          evidence: item.evidence,
        },
      };
    }
    return {
      type: "group" as const,
      data: {
        group: item.group,
        state: item.group.state,
        team: item.team,
        tournament: item.tournament,
        submissions: item.submissions,
        submitters: item.submitters.map(toUserWithRoles),
        submitterEvidence: item.submitterEvidence,
      },
    };
  });
}
