import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";

export interface EvidenceImage {
  _id: string;
  url: string;
  filename?: string;
}

export interface SubmitterEvidence {
  userId: string;
  submitterName: string;
  evidence: EvidenceImage[];
}

/**
 * Extended submission with full context for display
 */
export interface SubmissionWithContext {
  submission: Doc<"submissions">;
  state: Doc<"submissions">["state"];
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submitter: UserWithRoles;
  evidence: EvidenceImage[];
  teammates?: UserWithRoles[];
  managedBy?: UserWithRoles;
}

/**
 * Submission group with full context for display
 */
export interface GroupWithContext {
  group: Doc<"submissionGroups">;
  state: Doc<"submissionGroups">["state"];
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submissions: Array<Doc<"submissions">>;
  submitters: UserWithRoles[];
  submitterEvidence: SubmitterEvidence[];
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
 * Filter and sort state for submission lists
 */
export interface ReviewListFilters {
  search: string;
  states: Array<"pending" | "approved" | "rejected" | "deleted">;
  tournamentId?: Id<"tournaments">;
  teamId?: Id<"teams">;
  sortBy: "date-desc" | "date-asc" | "points-desc" | "points-asc";
}

/**
 * Permission checks for submission actions
 */
export interface ReviewPermissions {
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canViewDetails: boolean;
}
