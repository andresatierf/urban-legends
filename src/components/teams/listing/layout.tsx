import { Users } from "lucide-react";

import { SectionHeader } from "@/components/section-header";

import { JoinTeamCard } from "../join-team-card";
import { Browse } from "./browse";
import { ListingFilterBar } from "./filter-bar";
import type { TeamWithMembers, TournamentMap } from "./types";
import { useListingFilter } from "./use-listing-filter";
import { YourRoster } from "./your-roster";

type Props = {
  userTeams: TeamWithMembers[];
  allTeams: TeamWithMembers[];
  tournamentMap: TournamentMap;
  headerActions?: React.ReactNode;
};

export function TeamListing({
  userTeams,
  allTeams,
  tournamentMap,
  headerActions,
}: Props) {
  const f = useListingFilter({ userTeams, allTeams, tournamentMap });

  const hasAnyTeams = allTeams.length > 0;
  const showFilterBar =
    hasAnyTeams && (f.visibleTournaments.length > 1 || f.hasEndedTournaments);

  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        {headerActions}
      </SectionHeader>

      {showFilterBar && (
        <ListingFilterBar
          visibleTournaments={f.visibleTournaments}
          effectiveFilter={f.effectiveFilter}
          setFilter={f.setFilter}
          hasEndedTournaments={f.hasEndedTournaments}
          includeEnded={f.includeEnded}
          setIncludeEnded={f.setIncludeEnded}
        />
      )}

      {!hasAnyTeams ? (
        <JoinTeamCard first />
      ) : (
        <div className="space-y-8">
          {f.visibleUserTeams.length > 0 && (
            <YourRoster
              teams={f.visibleUserTeams}
              tournamentMap={tournamentMap}
              userTeamIds={f.userTeamIds}
              userTournamentIds={f.userTournamentIds}
            />
          )}

          <Browse
            teams={f.browseTeams}
            tournamentMap={tournamentMap}
            userTeamIds={f.userTeamIds}
            userTournamentIds={f.userTournamentIds}
            showTournamentEyebrow={f.showTournamentEyebrow}
            hasUserTeams={f.visibleUserTeams.length > 0}
          />
        </div>
      )}
    </div>
  );
}
