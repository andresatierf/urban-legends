"use client";

import { Calendar } from "lucide-react";

export default function MyTournaments() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Calendar className="h-8 w-8" />
        <h1 className="font-bold text-3xl">My Tournaments</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Assigned tournaments view coming soon (Spec 11)
        </p>
      </div>
    </div>
  );
}
