import { Loader2 } from "lucide-react";

/**
 * Full-screen spinner shown while Clerk resolves auth state on the client.
 * In SPA mode the auth check happens after hydration (there is no server
 * redirect), so layouts render this until `useAuth().isLoaded` is true.
 */
export function AuthPending() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: div with role="status" is the correct ARIA pattern for loading states
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
