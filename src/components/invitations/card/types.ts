import type { Doc } from "../../../../convex/_generated/dataModel";

export type InvitationDoc = Doc<"joinRequests"> & {
  counterparty: Doc<"users"> | null;
  team?: Doc<"teams"> | null;
  tournament?: Doc<"tournaments"> | null;
  invitedByUser?: Doc<"users"> | null;
};

export type Viewer = "team" | "user";
