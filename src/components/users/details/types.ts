import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../../convex/_generated/api";

export type UserDetails = NonNullable<
  FunctionReturnType<typeof api.users.getDetails>
>;
