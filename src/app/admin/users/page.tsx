"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

import { UserList } from "@/components/UserList";

export default function UsersPage() {
  const users = useQuery(api.users.listAll);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {users ? <UserList users={users} /> : <p>Loading users...</p>}
    </div>
  );
}
