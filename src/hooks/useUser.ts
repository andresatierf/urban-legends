import { useQuery } from "convex/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { hasMinimumRole, type RoleName } from "../../convex/roles";
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

export function useUserWithMinimumRole(role: RoleName) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !hasMinimumRole(user, role)) {
      router.replace("/dashboard");
    }
  }, [user, router, role]);

  return { user };
}
