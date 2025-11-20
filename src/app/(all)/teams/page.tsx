"use client";

import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { TeamCard } from "@/components/teams/team-card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function TeamsPage() {
  const { user } = useUser();
  const userTeams = useQuery(api.teams.list, { userId: user?._id }) || [];
  const allTeams = useQuery(api.teams.list, {}) || [];

  const tournamentIds = allTeams.map((t) => t.tournamentId);
  const tournaments = useQuery(
    api.tournaments.list,
    tournamentIds.length > 0 ? { tournamentIds } : "skip",
  );
  const tournamentMap = tournaments
    ? tournaments.reduce<
        Record<Id<"tournaments">, (typeof tournaments)[number]>
      >((acc, t) => {
        acc[t._id] = t;
        return acc;
      }, {})
    : {};

  const teamMembers = useQuery(
    api.teams.listMembers,
    allTeams.length > 0 ? { teamIds: allTeams.map((t) => t._id) } : "skip",
  );

  const teamMemberCounts = teamMembers
    ? allTeams.reduce(
        (acc, team) => {
          const members = teamMembers.filter((m) => m.teamId === team._id);
          acc[team._id] = members;
          return acc;
        },
        {} as Record<string, typeof teamMembers>,
      )
    : {};

  const userTeamIds = new Set(userTeams.map((team) => team._id));

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

      {allTeams && allTeams.length !== 0 && (
        <>
          <SectionHeader title="Your teams" />
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {userTeams.length > 0 ? (
              userTeams.map((team) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  tournament={tournamentMap?.[team.tournamentId]}
                  memberCount={teamMemberCounts?.[team._id]?.length || 0}
                  isUserMember={true}
                  isUserInTeam={true}
                />
              ))
            ) : (
              <JoinTeamCard />
            )}
          </div>
        </>
      )}

      <SectionHeader title="All teams"></SectionHeader>
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        {allTeams.length > 0 ? (
          allTeams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              tournament={tournamentMap?.[team.tournamentId]}
              memberCount={teamMemberCounts?.[team._id]?.length || 0}
              isUserMember={userTeamIds.has(team._id)}
              isUserInTeam={!!userTeams.length}
            />
          ))
        ) : (
          <JoinTeamCard first />
        )}
      </div>
    </>
  );
}
