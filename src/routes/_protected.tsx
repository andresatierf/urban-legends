import { RedirectToSignIn, useAuth } from "@clerk/tanstack-react-start";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AuthPending } from "@/components/auth-pending";
import { Layout } from "@/components/layout";
import { ThemedToaster } from "@/components/themed-toaster";

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  // Client-side auth gate: in SPA mode there is no server request to run a
  // `beforeLoad` redirect against, so we wait for Clerk to hydrate and then
  // send unauthenticated users to sign-in. Convex still enforces auth on the
  // backend, so this is a UX gate, not the security boundary.
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthPending />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <Layout>
          <Outlet />
        </Layout>
      </main>
      <ThemedToaster />
    </div>
  );
}
