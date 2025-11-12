"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { RoleManagementCard } from "@/components/admin/role-management-card";
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
  const currentUser = useQuery(api.users.current);

  if (!user || !currentUser) return null; // TODO: Add skeleton

  const isAdmin = currentUser.roles.includes("admin");

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
      <div className="flex flex-col gap-4">
        <UserDetailsCard user={user} />
        {isAdmin && (
          <RoleManagementCard
            userId={resolvedParams.userId}
            userName={user.name}
            currentRoles={user.roles}
          />
        )}
      </div>
      {/* TODO: Add teams table */}
    </>
  );
}
