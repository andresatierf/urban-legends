"use client";

import { Briefcase } from "lucide-react";

export default function TournamentManagerDashboard() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Briefcase className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Tournament Manager Dashboard</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Tournament manager dashboard coming soon (Spec 11)
        </p>
      </div>
    </div>
  );
}
