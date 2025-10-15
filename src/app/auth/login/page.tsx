"use client";

import { SignInForm } from "@/components/sign-in-form";
import { Unauthenticated, useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (isAuthenticated) redirect("/dashboard");
  }, [isAuthenticated]);

  return (
    <Unauthenticated>
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-bold text-4xl text-gray-900">
              BoolLegends
            </h1>
            <p className="text-gray-600 text-xl">
              Sign in to track your teams progress
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </Unauthenticated>
  );
}
