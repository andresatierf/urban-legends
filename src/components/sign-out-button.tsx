"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";

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
        redirect("/login");
      }}
    >
      Sign out
    </Button>
  );
}
