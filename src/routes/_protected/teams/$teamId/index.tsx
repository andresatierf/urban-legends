import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Trophy } from "lucide-react";

import { InvitedUsersList } from "@/components/invitations/invited-users-list";
import { JoinRequestsList } from "@/components/invitations/join-requests-list";
import { SectionHeader } from "@/components/section-header";
import { InviteMemberCard } from "@/components/teams/invite-member-card";
import { TeamDetailsCard } from "@/components/teams/team-details-card";
import { TeamMemberCard } from "@/components/teams/team-member-card";
import { Button } from "@/components/ui/button";
import { CardGrid } from "@/components/ui/card-grid";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/teams/$teamId/")({
  component: TeamDetailsPage,
});

function TeamDetailsPage() {
  const { teamId } = Route.useParams();
  const { user } = useUser();

  const data = useQuery(
    api.teams.getDetails,
    teamId ? { teamId: teamId as Id<"teams"> } : "skip",
  );

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
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: data.team.tournamentId }}
          >
            <Trophy />
            View Tournament
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/teams">
            <ArrowLeft />
            Back to My Teams
          </Link>
        </Button>
      </SectionHeader>

      <TeamDetailsCard data={data} />

      {(data.captain || regularMembers.length !== 0) && (
        <>
          <SectionHeader title="Team" />
          <CardGrid
            data={[data.captain]
              .concat(regularMembers)
              .filter((u): u is NonNullable<typeof u> => !!u)}
            empty={<InviteMemberCard team={data.team} isCaptain={isCaptain} />}
            className="grid-cols-1!"
          >
            {(member) => (
              <TeamMemberCard
                key={member._id}
                member={member}
                memberRole={member.memberRole}
                canRemove={isCaptain && member._id !== user?._id}
                onRemove={() =>
                  removeMember({
                    teamId: teamId as Id<"teams">,
                    userId: member._id,
                  })
                }
              />
            )}
          </CardGrid>
        </>
      )}

      <SectionHeader title="Invites and Requests" />
      <InvitedUsersList teamId={teamId as Id<"teams">} canCancel={isCaptain} />
      {data.team.joinPolicy !== "closed" && (
        <JoinRequestsList teamId={teamId as Id<"teams">} />
      )}
    </>
  );
}
