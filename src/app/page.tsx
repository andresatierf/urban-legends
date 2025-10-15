"use client";

import { useConvexAuth } from "convex/react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();

  // useEffect(() => {
  //   if (!isAuthenticated) redirect("/auth/login");
  // }, [isAuthenticated]);

  return null;
}
