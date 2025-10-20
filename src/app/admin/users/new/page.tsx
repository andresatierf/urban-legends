"use client";

import { CreateUserForm } from "@/components/users/create-user-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewUserPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-semibold text-2xl text-gray-800">
          Create User
        </h1>
        <Link href="/admin/users">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>

      <CreateUserForm />
    </>
  );
}
