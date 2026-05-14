import type { Doc } from "../../../../convex/_generated/dataModel";

export type MemberPreview = {
  _id: string;
  name: string;
  memberRole: "captain" | "member";
};

export type DaySummary = {
  date: string;
  approved: number;
  pending: number;
};

export type SubmissionSummary = {
  approved: number;
  pending: number;
  days: DaySummary[];
};

export type TeamCardData = {
  team: Doc<"teams">;
  tournament?: Doc<"tournaments">;
  members: MemberPreview[];
  memberCount: number;
  isUserMember: boolean;
  isUserInTeam: boolean;
  userRole?: "captain" | "member" | null;
  submissionSummary?: SubmissionSummary;
};
