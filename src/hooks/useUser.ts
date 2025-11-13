import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUser() {
  const user = useQuery(api.users.current);

  return {
    user,
    isDev: user?.roles?.includes("dev") ?? false,
    isAdmin: user?.roles?.includes("admin") ?? false,
  };
}
