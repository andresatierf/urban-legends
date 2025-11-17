"use client";

import { CheckSquare } from "lucide-react";

export default function PendingApprovals() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <CheckSquare className="h-8 w-8" />
        <h1 className="font-bold text-3xl">Pending Approvals</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Pending approvals view coming soon (Spec 11)
        </p>
      </div>
    </div>
  );
}
