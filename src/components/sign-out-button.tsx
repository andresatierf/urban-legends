"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";

export function SignOutButton({ className }: ButtonProps) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      className={className}
      onClick={() => {
        void signOut();
        redirect("/auth/login");
      }}
    >
      Sign out
    </Button>
  );
}
