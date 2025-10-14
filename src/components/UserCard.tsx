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
    <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex justify-between items-center">
      <p className="text-md font-medium">{user.email}</p>
      <div className="flex items-center gap-2">
        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <span
              key={team._id}
              className="bg-gray-200 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full"
            >
              {team.name}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">No teams</span>
        )}
      </div>
    </div>
  );
}
