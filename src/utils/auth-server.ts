import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const fetchClerkAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const clerkAuth = await auth();
    if (!clerkAuth.userId) {
      return { userId: null as string | null, token: null as string | null };
    }
    const token = await clerkAuth.getToken({ template: "convex" });
    return { userId: clerkAuth.userId, token };
  },
);
