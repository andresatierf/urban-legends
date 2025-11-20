"use client";

import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { TeamCard, TeamCardSkeleton } from "@/components/teams/team-card";
import { Button } from "@/components/ui/button";
import { CardGrid } from "@/components/ui/card-grid";
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

  if (userTeams === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Teams">
          {/* {isAdmin && <UpsertTournamentFormDialog />} */}
        </SectionHeader>
        <CardGrid data={Array.from({ length: 6 })}>
          {() => <TeamCardSkeleton />}
        </CardGrid>
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Teams">
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
          <CardGrid data={userTeams} empty={<JoinTeamCard />}>
            {(team) => (
              <TeamCard
                key={team._id}
                team={team}
                tournament={tournamentMap?.[team.tournamentId]}
                memberCount={teamMemberCounts?.[team._id]?.length || 0}
                isUserMember={true}
                isUserInTeam={true}
              />
            )}
          </CardGrid>
        </>
      )}

      <SectionHeader title="All teams"></SectionHeader>
      <CardGrid data={allTeams} empty={<JoinTeamCard first />}>
        {(team) => (
          <TeamCard
            key={team._id}
            team={team}
            tournament={tournamentMap?.[team.tournamentId]}
            memberCount={teamMemberCounts?.[team._id]?.length || 0}
            isUserMember={true}
            isUserInTeam={true}
          />
        )}
      </CardGrid>
    </>
  );
}
