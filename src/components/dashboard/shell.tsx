import type * as React from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-7 px-3 py-6 sm:gap-8 sm:px-8 sm:py-10">
      {children}
    </div>
  );
}
