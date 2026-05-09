import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { TeamCard, TeamCardSkeleton } from "@/components/teams/team-card";
import { Button } from "@/components/ui/button";
import { CardGrid } from "@/components/ui/card-grid";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  const { user } = useUser();
  const userTeams = useQuery(api.teams.listWithMembers, { userId: user?._id });
  const allTeams = useQuery(api.teams.listWithMembers, {});

  const tournamentIds = (allTeams ?? []).map((t) => t.tournamentId);
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

  if (userTeams === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Teams" />
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
          <Link to="/tournaments">
            <Trophy />
            View Tournaments
          </Link>
        </Button>
      </SectionHeader>

      {allTeams && allTeams.length !== 0 && (
        <>
          <SectionHeader title="Your teams" />
          <CardGrid data={userTeams ?? []} empty={<JoinTeamCard />}>
            {(team) => (
              <TeamCard
                key={team._id}
                team={team}
                tournament={tournamentMap?.[team.tournamentId]}
                memberCount={team.members.length}
                isUserMember={true}
                isUserInTeam={true}
                members={team.members}
              />
            )}
          </CardGrid>
        </>
      )}

      <SectionHeader title="All teams" />
      <CardGrid data={allTeams ?? []} empty={<JoinTeamCard first />}>
        {(team) => (
          <TeamCard
            key={team._id}
            team={team}
            tournament={tournamentMap?.[team.tournamentId]}
            memberCount={team.members.length}
            isUserMember={true}
            isUserInTeam={true}
            members={team.members}
          />
        )}
      </CardGrid>
    </>
  );
}
