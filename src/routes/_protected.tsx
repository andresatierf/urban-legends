import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Toaster } from "sonner";

import { Layout } from "@/components/layout";
import { fetchClerkAuth } from "@/utils/auth-server";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth();
    if (!userId) {
      throw redirect({ to: "/sign-in/$", params: { _splat: "" } });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <Layout>
          <Outlet />
        </Layout>
      </main>
      <Toaster />
    </div>
  );
}
