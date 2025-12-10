import type { Doc, Id } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { toUserWithRoles } from "@/components/users/transforms";

/**
 * Image metadata for submission attachments
 * @future This will be populated when image storage is implemented
 */
export interface SubmissionImage {
  _id: string;
  url: string;
  filename: string;
  submissionId: Id<"submissions">;
  uploadedAt: string;
}

/**
 * Extended submission with full context for display
 */
export interface SubmissionWithContext {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submitter: UserWithRoles;
  images: SubmissionImage[];
  teammates?: UserWithRoles[];
  managedBy?: UserWithRoles;
  isTeamExercise: boolean;
  participationRate: number;
}

/**
 * Submission group with full context for display
 */
export interface GroupWithContext {
  group: Doc<"submissionGroups">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submissions: Array<Doc<"submissions">>;
  submitters: UserWithRoles[];
  images: SubmissionImage[];
  managedBy?: UserWithRoles;
}

/**
 * Discriminated union type for review items
 * Allows a single component to handle both individual submissions and groups
 */
export type ReviewItem =
  | { type: "individual"; data: SubmissionWithContext }
  | { type: "group"; data: GroupWithContext };

/**
 * API response type from getPendingSubmissions
 * Discriminated union with shared properties
 */
type PendingSubmissionsItem = {
  date: string;
  createdAt: string;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
} & (
  | {
      type: "individual";
      id: Id<"submissions">;
      submission: Doc<"submissions">;
      submitter: Doc<"users">;
    }
  | {
      type: "group";
      id: Id<"submissionGroups">;
      group: Doc<"submissionGroups">;
      submissions: Array<Doc<"submissions">>;
      submitters: Array<Doc<"users">>;
    }
);

interface PendingSubmissionsResponse {
  items: PendingSubmissionsItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Convert API response from getPendingSubmissions to ReviewItem array
 */
export function convertToReviewItems(
  pendingData: PendingSubmissionsResponse | undefined,
): ReviewItem[] {
  if (!pendingData) return [];

  return pendingData.items.map((item) => {
    if (item.type === "individual") {
      return {
        type: "individual" as const,
        data: {
          submission: item.submission,
          team: item.team,
          tournament: item.tournament,
          submitter: toUserWithRoles(item.submitter),
          // Placeholders for features not yet implemented:
          images: [], // Will be populated when image storage is implemented
          isTeamExercise: false, // Individual submissions are not team exercises
          participationRate: 0, // Not applicable for individual submissions
        },
      };
    } else {
      return {
        type: "group" as const,
        data: {
          group: item.group,
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
