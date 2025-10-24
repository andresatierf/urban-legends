"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export function RedirectToDashboard() {
  useEffect(() => {
    redirect("/dashboard");
  }, []);

  return null;
}
