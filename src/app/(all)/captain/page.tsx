"use client";

import { Shield } from "lucide-react";

export default function CaptainDashboard() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Team Captain Dashboard</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Captain dashboard coming soon (Spec 13)
        </p>
      </div>
    </div>
  );
}
