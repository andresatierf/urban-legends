import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";
import {
  InvitedUsersList,
  JoinRequestsList,
} from "@/components/invitations/listing";

import { Button } from "../../ui/button";
import { MemberRoster } from "./member-roster";
import { Sidebar } from "./sidebar";
import type { TeamDetails } from "./types";

type Props = {
  data: TeamDetails;
};

export function TeamDetailsLayout({ data }: Props) {
  const isCaptain = data.userMembership?.role === "captain";

  return (
    <DetailsPageLayout
      title="Team Details"
      headerActions={
        <Button variant="outline" asChild>
          <Link to="/teams">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      }
      sidebar={<Sidebar data={data} />}
    >
      <MemberRoster data={data} />
      <InvitedUsersList teamId={data.team._id} canCancel={isCaptain} />
      {data.team.joinPolicy !== "closed" && (
        <JoinRequestsList teamId={data.team._id} />
      )}
    </DetailsPageLayout>
  );
}
