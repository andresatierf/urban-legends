import type { Doc } from "../../../../convex/_generated/dataModel";

export type MemberPreview = {
  _id: string;
  name: string;
  memberRole: "captain" | "member";
};

export type TeamCardData = {
  team: Doc<"teams">;
  tournament?: Doc<"tournaments">;
  members: MemberPreview[];
  memberCount: number;
  isUserMember: boolean;
  isUserInTeam: boolean;
  userRole?: "captain" | "member" | null;
  rank?: number;
  totalTeams?: number;
};
