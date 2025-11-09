"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { use, useMemo } from "react";
import { DataTableSection } from "@/components/data-table-section";
import { InviteMemberFormButton } from "@/components/form/invite-member-form-button";
import { SectionHeader } from "@/components/section-header";
import { InvitedUsersList } from "@/components/teams/invited-users-list";
import { JoinRequestsList } from "@/components/teams/join-requests-list";
import { TeamDetailsCard } from "@/components/teams/team-details-card";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ teamId: Id<"teams"> }>;
};

export default function TeamDetailsPage({ params }: Props) {
  const { teamId } = use(params);
  const user = useQuery(api.users.current);
  const roles = useQuery(
    api.roles.getByUserId,
    user ? { userId: user._id } : "skip",
  );
  const team = useQuery(api.teams.get, teamId ? { teamId } : "skip");
  const tournament = useQuery(
    api.tournaments.get,
    team ? { tournamentId: team.tournamentId } : "skip",
  );
  const members = useQuery(
    api.teams.listTeamMembers,
    teamId ? { teamId } : "skip",
  );
  const teamMembers = useQuery(
    api.teams.listMembers,
    teamId ? { teamIds: teamId } : "skip",
  );

  // Check if user is captain or admin
  const isAdmin = roles?.includes("admin");
  const userMembership = teamMembers?.find((m) => m.userId === user?._id);
  const isCaptain = userMembership?.role === "captain";
  const canInviteMembers = isAdmin || isCaptain;

  const columns: ColumnDef<NonNullable<typeof members>[number]>[] = useMemo(
    () => [
      { id: "name", accessorKey: "email", header: "Name" },
      {
        accessorKey: "role",
        header: () => <div className="text-right">Role</div>,
        // header: "Role",
        cell: (props) => (
          <div className="text-right text-gray-600">
            {props.getValue() as string}
          </div>
        ),
      },
    ],
    [],
  );

  if (!team || !tournament || !members) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Team Details">
        {canInviteMembers && (
          <InviteMemberFormButton
            teamId={teamId}
            tournamentId={team.tournamentId}
          />
        )}
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${team?.tournamentId}`}>
            <Trophy />
            View Tournament
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/teams">
            <ArrowLeft />
            Back to My Teams
          </Link>
        </Button>
      </SectionHeader>

      <TeamDetailsCard team={team} tournament={tournament} enableActions />

      <DataTableSection
        title="Members"
        columns={columns}
        data={members}
        emptyMessage="No members yet."
      />

      <InvitedUsersList teamId={teamId} />

      <JoinRequestsList teamId={teamId} />
    </>
  );
}
