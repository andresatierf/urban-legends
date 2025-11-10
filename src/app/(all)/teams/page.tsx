"use client";

import { useQuery } from "convex/react";
import { capitalize } from "lodash";
import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { SectionHeader } from "@/components/section-header";
import { TeamsDataTable } from "@/components/teams/teams-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export default function TeamsPage() {
  const { user, isAdmin } = useUser();
  const userTeams = useQuery(api.teams.list, { userId: user?._id }) || [];
  const allTeams = useQuery(api.teams.list, isAdmin ? {} : "skip") || [];

  const tournamentIds = useMemo(() => {
    const userTournamentIds = userTeams.map((team) => team.tournamentId);
    const allTournamentIds = allTeams.map((team) => team.tournamentId);

    return Array.from(new Set([...userTournamentIds, ...allTournamentIds]));
  }, [userTeams, allTeams]);

  const tournaments =
    useQuery(api.tournaments.list, {
      tournamentIds: tournamentIds,
    }) || [];

  const tournamentIdMap = useMemo(() => {
    return tournaments.reduce<Map<Id<"tournaments">, Doc<"tournaments">>>(
      (acc, tournament) => {
        if (!acc.has(tournament._id)) acc.set(tournament._id, tournament);
        return acc;
      },
      new Map(),
    );
  }, [tournaments]);

  const teamMembers =
    useQuery(api.teams.listMembers, {
      teamIds: userTeams.map((team) => team._id),
    }) || [];

  const teamMembersPerTeamMap = useMemo(() => {
    return teamMembers.reduce<Map<Id<"teams">, Doc<"teamMembers">[]>>(
      (acc, member) => {
        if (!acc.has(member.teamId)) acc.set(member.teamId, []);
        acc.get(member.teamId)?.push(member);
        return acc;
      },
      new Map(),
    );
  }, [teamMembers]);

  const users =
    useQuery(api.users.list, {
      userIds: teamMembers.map((teamMember) => teamMember.userId),
    }) || [];
  const userMap = useMemo(() => {
    return users.reduce<Map<Id<"users">, Doc<"users">>>(
      (acc, user) => acc.set(user._id, user),
      new Map(),
    );
  }, [users]);

  const userTeamsTableData = useMemo(() => {
    return userTeams.map((team) => {
      const members = teamMembersPerTeamMap.get(team._id);

      return {
        ...team,
        role: members?.find((m) => m.userId === user?._id)?.role,
        tournament: tournamentIdMap.get(team.tournamentId),
        members: members?.map((m) => ({ ...m, user: userMap.get(m.userId) })),
      };
    });
  }, [userTeams, tournamentIdMap, teamMembersPerTeamMap, userMap, user?._id]);

  const allTeamsTableData = useMemo(() => {
    return allTeams.map((team) => {
      const members = teamMembersPerTeamMap.get(team._id);
      return {
        ...team,
        tournament: tournamentIdMap.get(team.tournamentId),
        members: members?.map((m) => ({ ...m, user: userMap.get(m.userId) })),
      };
    });
  }, [allTeams, tournamentIdMap, teamMembersPerTeamMap, userMap]);

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

      <TeamsDataTable title="Your teams" teams={userTeamsTableData} showRole />

      {isAdmin && (
        <TeamsDataTable
          title="All teams"
          teams={allTeamsTableData}
          showActions
          enableSearch
        />
      )}

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
