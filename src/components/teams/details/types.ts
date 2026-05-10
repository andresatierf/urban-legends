import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../../convex/_generated/api";

export type TeamDetails = NonNullable<
  FunctionReturnType<typeof api.teams.getDetails>
>;
