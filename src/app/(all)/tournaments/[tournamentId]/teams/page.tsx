"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { JoinTeamButton } from "@/components/teams/join-team-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentTeamsPage({ params }: Props) {
  const { tournamentId } = use(params);

  const user = useQuery(api.users.current);
  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId } : "skip",
  );
  const teams = useQuery(
    api.teams.list,
    tournamentId ? { tournamentId } : "skip",
  );
  const userTeam = useQuery(
    api.teams.getUserTeamByTournament,
    tournamentId ? { tournamentId } : "skip",
  );

  // Get team members count for each team
  const teamMembers = useQuery(
    api.teams.listMembers,
    teams ? { teamIds: teams.map((t) => t._id) } : "skip",
  );

  if (!tournament) return null; // TODO: Add skeleton

  const teamMemberCounts = teamMembers
    ? teams?.reduce(
        (acc, team) => {
          const members = teamMembers.filter((m) => m.teamId === team._id);
          acc[team._id] = members;
          return acc;
        },
        {} as Record<Id<"teams">, typeof teamMembers>,
      )
    : {};

  return (
    <>
      <SectionHeader as="h1" title={`Teams in ${tournament.name}`}>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/tournaments/${tournamentId}`}>
              <ArrowLeft />
              Back
            </Link>
          </Button>
          {!userTeam && (
            <Button asChild>
              <Link href={`/tournaments/${tournamentId}/teams/new`}>
                Create Team
              </Link>
            </Button>
          )}
        </div>
      </SectionHeader>

      {userTeam && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
            <CardDescription>
              You are already part of a team in this tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{userTeam.name}</p>
                <Badge variant="secondary">
                  {teamMemberCounts?.[userTeam._id]?.length || 0} members
                </Badge>
              </div>
              <Button asChild variant="outline">
                <Link href={`/teams/${userTeam._id}`}>View Team</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {!teams || teams.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <Empty
                title="No teams yet"
                description="Be the first to create a team for this tournament!"
              />
            </CardContent>
          </Card>
        ) : (
          teams.map((team) => {
            const members = teamMemberCounts?.[team._id] || [];
            const memberCount = members.length;
            const isUserMember = userTeam?._id === team._id;
            const isFull =
              team.maxMembers && memberCount >= team.maxMembers;

            return (
              <Card key={team._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{team.name}</CardTitle>
                        <Badge
                          variant={
                            team.visibility === "public"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {team.visibility}
                        </Badge>
                        {isFull && (
                          <Badge variant="destructive">Full</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {memberCount}
                          {team.maxMembers ? ` / ${team.maxMembers}` : ""}{" "}
                          members
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {user && (
                        <JoinTeamButton
                          teamId={team._id}
                          team={team}
                          currentMemberCount={memberCount}
                          isUserMember={isUserMember}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
