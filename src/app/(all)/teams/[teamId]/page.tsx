"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { InvitedUsersList } from "@/components/invitations/invited-users-list";
import { JoinRequestsList } from "@/components/invitations/join-requests-list";
import { SectionHeader } from "@/components/section-header";
import { InviteMemberCard } from "@/components/teams/invite-member-card";
import { TeamDetailsCard } from "@/components/teams/team-details-card";
import { TeamMemberCard } from "@/components/teams/team-member-card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ teamId: Id<"teams"> }>;
};

export default function TeamDetailsPage({ params }: Props) {
  const { teamId } = use(params);
  const { user } = useUser();

  const data = useQuery(api.teams.getDetails, teamId ? { teamId } : "skip");

  const removeMember = useMutation(api.teams.removeMember);

  if (!data) {
    return <PageSkeleton headerTitle="Team Details" sections={3} />;
  }

  const regularMembers = data.members.filter(
    (member) => member.memberRole === "member",
  );
  const isCaptain = data.userMembership?.role === "captain";

  return (
    <>
      <SectionHeader as="h1" title="Team Details">
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${data.team.tournamentId}`}>
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

      <TeamDetailsCard data={data} />

      {(data.captain || regularMembers.length !== 0) && (
        <>
          <SectionHeader title="Team" />
          {data.captain ? (
            <TeamMemberCard
              member={data.captain}
              memberRole="captain"
              canRemove={false}
            />
          ) : (
            <p className="text-muted-foreground">No captain yet.</p>
          )}

          {regularMembers.length !== 0 ? (
            <div className="space-y-3">
              {regularMembers.map((member) => (
                <TeamMemberCard
                  key={member._id}
                  member={member}
                  memberRole="member"
                  canRemove={isCaptain && member._id !== user?._id}
                  onRemove={() =>
                    removeMember({
                      teamId: teamId,
                      userId: member._id,
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <InviteMemberCard team={data.team} isCaptain={isCaptain} />
          )}
        </>
      )}

      <SectionHeader title="Invites and Requests" />
      <InvitedUsersList teamId={teamId} canCancel={isCaptain} />
      {data.team.visibility !== "private" && (
        <JoinRequestsList teamId={teamId} />
      )}
    </>
  );
}
