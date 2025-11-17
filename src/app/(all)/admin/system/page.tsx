"use client";

import { Activity } from "lucide-react";

export default function SystemHealth() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <Activity className="h-8 w-8" />
        <h1 className="text-3xl font-bold">System Health</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          System health monitoring coming soon
        </p>
      </div>
    </div>
  );
}
