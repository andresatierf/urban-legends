import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasMinimumRole, type RoleName } from "../../common/roles";
import { api } from "../../convex/_generated/api";
import type { UserWithRoles } from "../../convex/users";

export function useUser({ shouldThrow }: { shouldThrow?: boolean } = {}) {
  const user = useQuery(api.users.current, { throw: shouldThrow !== false });

  const roleNames = user?.roleNames ?? [];

  return {
    user: user as typeof shouldThrow extends false
      ? UserWithRoles | null
      : UserWithRoles,
    isDev: roleNames.includes("dev"),
    isAdmin: roleNames.includes("admin"),
    isTournamentManager: roleNames.includes("tournament_manager"),
    canCreateTournament:
      roleNames.includes("admin") ||
      roleNames.includes("dev") ||
      roleNames.includes("organizer"),
  };
}

export function useUserWithMinimumRole(
  role: RoleName,
  target: string = "/dashboard",
) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !hasMinimumRole(user, role)) {
      router.replace(target);
    }
  }, [user, router, role, target]);

  return { user };
}
