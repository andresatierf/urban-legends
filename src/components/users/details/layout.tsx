import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";

import { Button } from "../../ui/button";
import { Sidebar } from "./sidebar";
import { TournamentHistory } from "./tournament-history";
import type { UserDetails } from "./types";

type Props = {
  data: UserDetails;
};

export function UserDetailsLayout({ data }: Props) {
  return (
    <DetailsPageLayout
      title="Player Details"
      headerActions={
        <Button variant="outline" asChild>
          <Link to="/users">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      }
      sidebar={<Sidebar data={data} />}
    >
      <TournamentHistory data={data} />
    </DetailsPageLayout>
  );
}
