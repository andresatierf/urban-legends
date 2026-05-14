import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { fetchClerkAuth } from "@/utils/auth-server";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth();
    if (userId) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
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
