"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { UserDetailsCard } from "@/components/users/user-details-card";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ userId: Id<"users"> }>;
};

export default function UserDetailsPage({ params }: Props) {
  const resolvedParams = use(params);

  const data = useQuery(
    api.users.getDetails,
    resolvedParams.userId ? { userId: resolvedParams.userId } : "skip",
  );

  if (!data) {
    return <PageSkeleton headerTitle="User Details" sections={2} />;
  }

  return (
    <>
      <SectionHeader as="h1" title="User Details">
        <Button variant="outline" asChild>
          <Link href="/users">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <UserDetailsCard data={data} />
    </>
  );
}
