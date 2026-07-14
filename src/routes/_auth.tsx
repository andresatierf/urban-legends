import { useAuth } from "@clerk/tanstack-react-start";
import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";

import { AuthPending } from "@/components/auth-pending";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  // Client-side counterpart to the protected gate: once Clerk has hydrated,
  // bounce already-signed-in users away from the sign-in/up screens.
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthPending />;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="bg-paper flex min-h-screen w-full flex-col">
      <div className="pointer-events-auto fixed top-2 right-2 z-50">
        <ThemeSwitcher />
      </div>
      <main className="m-4 flex flex-1 flex-col items-center justify-center gap-4">
        <Outlet />
      </main>
    </div>
  );
}
