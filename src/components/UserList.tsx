"use client";

import { UserCard } from "./UserCard";
import type { Doc } from "../../convex/_generated/dataModel";

interface UserListProps {
  users: Doc<"users">[];
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user._id} user={user} />
      ))}
    </div>
  );
}
