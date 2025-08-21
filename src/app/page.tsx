"use client";

import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
  }, [isAuthenticated]);

  return null;
}
