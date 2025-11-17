"use client";

import { TrendingUp } from "lucide-react";

export default function ReviewStatistics() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <TrendingUp className="h-8 w-8" />
        <h1 className="font-bold text-3xl">Review Statistics</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Review statistics coming soon (Spec 12)
        </p>
      </div>
    </div>
  );
}
