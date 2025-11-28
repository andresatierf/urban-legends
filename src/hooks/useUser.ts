import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { UserWithRoles } from "../../convex/users";

export function useUser({ shouldThrow }: { shouldThrow?: boolean } = {}) {
  const user = useQuery(api.users.current, { throw: shouldThrow !== false });

  return {
    user: user as typeof shouldThrow extends false
      ? UserWithRoles | null
      : UserWithRoles,
    isDev: user?.roleNames?.includes("dev") ?? false,
    isAdmin: user?.roleNames?.includes("admin") ?? false,
    isTournamentManager:
      user?.roleNames?.includes("tournament_manager") ?? false,
  };
}
