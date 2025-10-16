"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { ChevronRight } from "lucide-react";

export default function UserTeamsPage() {
  const teams = useQuery(api.teams.listByUser);

  console.log({ teams });
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="My Teams">
        <Link href="/tournaments">
          <Button variant="outline">🏆 View Tournaments</Button>
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          {teams?.length && teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team, index) => (
                <div
                  key={team._id}
                  className={cn("flex items-center justify-between", {
                    "border-t pt-3": index > 0,
                  })}
                >
                  <div className="flex-grow">
                    <div className="flex gap-2">
                      <h4 className="font-medium">{team.name}</h4>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          team.tournament?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {team.tournament?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {team.tournament?.name} • {team.role}
                    </p>
                  </div>
                  <span className="font-medium text-blue-600 text-sm">
                    {team.score || 0} pts
                  </span>
                  <div className="ml-2 h-full border-l">
                    <Link href={`/teams/${team._id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-l-none"
                      >
                        <ChevronRight />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              You're not part of any teams yet. Contact an admin to be added to
              a team.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
