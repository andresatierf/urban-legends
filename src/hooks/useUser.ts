import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUser() {
  const user = useQuery(api.users.current);

  return {
    user,
    isDev: user?.roleNames?.includes("dev") ?? false,
    isAdmin: user?.roleNames?.includes("admin") ?? false,
    isTournamentManager:
      user?.roleNames?.includes("tournament_manager") ?? false,
  };
}
