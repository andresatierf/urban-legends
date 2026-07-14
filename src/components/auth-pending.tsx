import { Loader2 } from "lucide-react";

// Shown by layouts while Clerk resolves auth state; SPA mode has no server redirect.
export function AuthPending() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
