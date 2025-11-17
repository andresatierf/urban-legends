"use client";

import { BarChart3 } from "lucide-react";

export default function TeamComparison() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 className="h-8 w-8" />
        <h1 className="font-bold text-3xl">Team Comparison</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Team comparison view coming soon (Spec 13)
        </p>
      </div>
    </div>
  );
}
