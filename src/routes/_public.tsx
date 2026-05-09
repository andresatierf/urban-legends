import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <main className="flex-1">
        <Layout>
          <Outlet />
        </Layout>
      </main>
      <Toaster />
    </div>
  );
}
