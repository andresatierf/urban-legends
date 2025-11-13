"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { UserDetailsCard } from "@/components/users/user-details-card";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ userId: Id<"users"> }>;
};

export default function UserDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const user = useQuery(api.users.getById, {
    id: resolvedParams.userId,
  });

  if (user === undefined) return null; // TODO: Add skeleton
  if (user === null) return null; // TODO: handle not-found state

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

      <UserDetailsCard user={user} />
    </>
  );
}
