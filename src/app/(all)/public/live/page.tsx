"use client";

import { Tv } from "lucide-react";

export default function LiveTournaments() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Tv className="h-8 w-8" />
        <h1 className="font-bold text-3xl">Live Tournaments</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Live tournaments feed coming soon (Spec 14)
        </p>
      </div>
    </div>
  );
}
