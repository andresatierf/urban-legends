import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUser() {
  const user = useQuery(api.users.current);
  const roles = useQuery(
    api.roles.getByUserId,
    user ? { userId: user?._id } : "skip",
  );

  return {
    user,
    roles,
    isAdmin: !!roles?.includes("admin"),
  };
}
