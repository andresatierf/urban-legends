import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export type TeamWithMembers = FunctionReturnType<
  typeof api.teams.listWithMembers
>[number];

export type TournamentMap = Record<Id<"tournaments">, Doc<"tournaments">>;
