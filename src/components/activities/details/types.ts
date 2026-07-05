import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../../convex/_generated/api";

export type ActivityDetailsData = FunctionReturnType<
  typeof api.activities.getDetails
>;
