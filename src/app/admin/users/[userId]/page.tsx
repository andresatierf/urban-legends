"use client";

import { SectionHeader } from "@/components/section-header";
import { UserDetailsCard } from "@/components/UserDetailsCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { DetailsCard } from "@/components/details-card";

type Props = {
  params: Promise<{ userId: Id<"users"> }>;
};

export default function UserDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const user = useQuery(api.users.getById, {
    id: resolvedParams.userId,
  });

  if (!user) return null; // TODO: Add skeleton

  const details = [{ key: "roles", value: user.roles.join(", ") }];

  return (
    <>
      <SectionHeader as="h1" text="User Details">
        <Link href="/admin/users">
          <Button variant="outline">← Back</Button>
        </Link>
      </SectionHeader>

      <UserDetailsCard user={user} />
      <DetailsCard title={user.email} details={details} />
    </>
  );
}
