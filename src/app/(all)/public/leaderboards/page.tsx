"use client";

import { Trophy } from "lucide-react";

export default function PublicLeaderboards() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Public Leaderboards</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Public leaderboards coming soon (Spec 14)
        </p>
      </div>
    </div>
  );
}
