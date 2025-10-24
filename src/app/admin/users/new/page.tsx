"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { CreateUserForm } from "@/components/users/create-user-form";

export default function NewUserPage() {
  return (
    <>
      <SectionHeader as="h1" title="Create User">
        <Button href="/admin/users" variant="outline">
          ← Back
        </Button>
      </SectionHeader>
      <CreateUserForm />
    </>
  );
}
