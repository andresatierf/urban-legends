import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useStoreUserEffect() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);

  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    async function createUser() {
      const id = await storeUser();
      setUserId(id);
    }
    createUser();
    return () => setUserId(null);
  }, [isAuthenticated, storeUser]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
