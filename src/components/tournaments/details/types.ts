import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../../convex/_generated/api";

export type TournamentDetails = NonNullable<
  FunctionReturnType<typeof api.tournaments.getDetails>
>;

export type TournamentTeam = TournamentDetails["teams"][number];
