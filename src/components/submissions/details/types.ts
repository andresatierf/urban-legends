import type { Doc } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";

export type SubmissionDetailsData = {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submitter: UserWithRoles;
  teammates: UserWithRoles[];
  managedByUser: UserWithRoles | null;
  isTeamExercise: boolean;
  evidence: Array<{ _id: string; url: string; filename?: string }>;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
};
