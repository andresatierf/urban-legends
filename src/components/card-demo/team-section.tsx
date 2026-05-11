import { SectionHeader } from "../section-header";
import { TeamCard } from "../teams/card/layout";
import { DEMO_TEAM_ITEMS } from "./team-fixtures";

export function TeamSection() {
  return (
    <section>
      <SectionHeader
        as="h1"
        title="Team"
        description="The production team listing card across the 9-state matrix (open/closed/full × outsider/member/captain)."
      />

      <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_TEAM_ITEMS.map((item) => (
          <div key={item.team._id}>
            <TeamCard
              data={{
                team: item.team,
                tournament: item.tournament,
                members: item.members,
                memberCount: item.memberCount,
                isUserMember: item.isUserMember,
                isUserInTeam: item.isUserMember,
                userRole: item.userRole,
              }}
            />
            <p className="text-muted-foreground mt-1 text-center text-[0.625rem]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
