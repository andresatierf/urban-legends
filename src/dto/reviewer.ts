import type { FunctionReturnType } from "convex/server";
import type { ReviewItem } from "@/components/submissions/review/types";
import { toUserWithRoles } from "@/components/users/transforms";
import type { api } from "../../convex/_generated/api";

/**
 * Convert API response from getPendingSubmissions to ReviewItem array
 */
export function convertToReviewItems(
  pendingData:
    | FunctionReturnType<typeof api.role.reviewer.getPendingSubmissions>
    | undefined,
): ReviewItem[] {
  if (!pendingData) return [];

  return pendingData.items.map((item) => {
    if (item.type === "individual") {
      return {
        type: "individual" as const,
        data: {
          submission: item.submission,
          state: item.submission.state,
          team: item.team,
          tournament: item.tournament,
          submitter: toUserWithRoles(item.submitter),
          // Placeholders for features not yet implemented:
          images: [], // Will be populated when image storage is implemented
        },
      };
    } else {
      return {
        type: "group" as const,
        data: {
          group: item.group,
          state: item.group.state,
          team: item.team,
          tournament: item.tournament,
          submissions: item.submissions,
          submitters: item.submitters.map(toUserWithRoles),
          // Placeholder for image storage feature:
          // TODO: Aggregate images from all submissions in the group when image upload is implemented
          images: [],
        },
      };
    }
  });
}
