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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              BoolLegends
            </h1>
            <p className="text-xl text-gray-600">
              Sign in to track your teams progress
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </Unauthenticated>
  );
}
