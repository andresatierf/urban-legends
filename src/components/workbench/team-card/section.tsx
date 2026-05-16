import { SectionHeader } from "@/components/section-header";
import { TeamCard } from "@/components/teams/card";

import { VariantMatrix } from "../shells/variant-matrix";
import {
  TEAM_STATES,
  VIEWER_CONTEXTS,
  VIEWER_CONTEXT_LABELS,
  getTeamDemoItem,
} from "./fixtures";

export function TeamSection() {
  return (
    <section>
      <SectionHeader
        as="h1"
        title="Team"
        description="The production team listing card across the 9-state matrix (open/closed/full × outsider/member/captain)."
      />

      <div className="mt-8">
        <VariantMatrix
          variants={TEAM_STATES}
          columns={VIEWER_CONTEXTS}
          columnLabel={(ctx) => VIEWER_CONTEXT_LABELS[ctx]}
          renderCell={(state, viewer) => {
            const item = getTeamDemoItem(state, viewer);
            if (!item) return null;
            return (
              <TeamCard
                data={{
                  team: item.team,
                  tournament: item.tournament,
                  members: item.members,
                  memberCount: item.memberCount,
                  isUserMember: item.isUserMember,
                  isUserInTeam: item.isUserMember,
                  userRole: item.userRole,
                  rank: item.rank,
                  totalTeams: item.totalTeams,
                }}
                joinRequest={null}
                onRequestJoin={async () => {}}
                onCancelRequest={() => {}}
                onLeave={() => {}}
              />
            );
          }}
        />
      </div>
    </section>
  );
}
