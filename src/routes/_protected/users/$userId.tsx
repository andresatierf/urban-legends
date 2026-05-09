import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { UserDetailsCard } from "@/components/users/user-details-card";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/users/$userId")({
  component: UserDetailsPage,
});

function UserDetailsPage() {
  const { userId } = Route.useParams();

  const data = useQuery(
    api.users.getDetails,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );

  if (!data) {
    return <PageSkeleton headerTitle="User Details" sections={2} />;
  }

  return (
    <>
      <SectionHeader as="h1" title="User Details">
        <Button variant="outline" asChild>
          <Link to="/users">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <UserDetailsCard data={data} />
    </>
  );
}
