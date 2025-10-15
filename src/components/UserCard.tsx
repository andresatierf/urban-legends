"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UserCardProps {
  user: {
    _id: Id<"users">;
    email: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const teams = useQuery(api.teams.getUserTeams, { userId: user._id });

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <p className="font-medium text-md">{user.email}</p>
      <div className="flex items-center gap-2">
        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <span
              key={team._id}
              className="mr-2 rounded-full bg-gray-200 px-2.5 py-0.5 font-medium text-gray-800 text-xs"
            >
              {team.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500 text-xs">No teams</span>
        )}
      </div>
    </div>
  );
}
