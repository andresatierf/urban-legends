import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";

import { Layout } from "@/components/layout";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
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
