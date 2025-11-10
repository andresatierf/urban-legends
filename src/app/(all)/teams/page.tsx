"use client";

import { useQuery } from "convex/react";
import { capitalize } from "lodash";
import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { TeamCard } from "@/components/teams/team-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

export default function TeamsPage() {
  const { user, isAdmin } = useUser();
  const userTeams = useQuery(api.teams.list, { userId: user?._id }) || [];
  const allTeams = useQuery(api.teams.list, {}) || [];

  return (
    <>
      <SectionHeader as="h1" title="My Teams">
        <Button asChild variant="outline">
          <Link href="/tournaments">
            <Trophy />
            View Tournaments
          </Link>
        </Button>
      </SectionHeader>

      <SectionHeader title="Your teams"></SectionHeader>

      {userTeams.length > 0 ? (
        userTeams.map((team) => (
          <TeamCard
            key={team._id}
            team={team}
            memberCount={0}
            isUserMember={true}
            isUserInTeam={true}
          />
        ))
      ) : (
        <JoinTeamCard />
      )}

      <SectionHeader title="All teams"></SectionHeader>

      <Card>
        <CardContent>
          {allTeams?.length && allTeams.length > 0 ? (
            <div className="space-y-3">
              {allTeams.map((team, index) => (
                <div
                  key={team._id}
                  className={cn("flex items-center justify-between", {
                    "border-t pt-3": index > 0,
                  })}
                >
                  <div className="grow">
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
                      {[
                        team.tournament?.name,
                        capitalize(team.role || "member"),
                        `${team.members?.length || 0} members`,
                      ]
                        .filter((x) => x)
                        .join(" • ")}
                    </p>
                  </div>
                  <span className="font-medium text-blue-600 text-sm">
                    - pts
                  </span>
                  <div className="ml-2 h-full border-l">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-l-none"
                      asChild
                    >
                      <Link href={`/teams/${team._id}`}>
                        <ChevronRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              You're not part of any teams yet.
              {!isAdmin && " Contact an admin to be added to a team."}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
