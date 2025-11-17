"use client";

import { Flag } from "lucide-react";

export default function FlaggedSubmissions() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Flag className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Flagged Submissions</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Flagged submissions view coming soon (Spec 12)
        </p>
      </div>
    </div>
  );
}
