import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUser() {
  const user = useQuery(api.users.current);

  return {
    user,
    isAdmin: user?.roles.includes("admin") ?? false,
  };
}
