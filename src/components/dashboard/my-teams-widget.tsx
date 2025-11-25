import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { Doc } from "../../../convex/_generated/dataModel";
import { SectionHeader } from "../section-header";
import { UserTeamCard } from "../teams/user-team-card";

interface MyTeamsWidgetProps {
  teams: Array<{
    team: Doc<"teams">;
    tournament: Doc<"tournaments">;
    memberCount: number;
    userRole: "captain" | "member";
  }>;
}

export function MyTeamsWidget({ teams }: MyTeamsWidgetProps) {
  return (
    <div className="space-y-4">
      <SectionHeader title="My Teams" />
      {teams.length === 0 ? (
        <Empty className="gap-3 py-2!">
          <EmptyTitle>No teams yet</EmptyTitle>
          <EmptyDescription>
            Join or create a team to participate in tournaments.
          </EmptyDescription>
          <Button asChild className="mt-4">
            <Link href="/tournaments">Find a Tournament</Link>
          </Button>
        </Empty>
      ) : (
        <div className="space-y-3">
          {teams.map(({ team, tournament, memberCount, userRole }) => (
            <UserTeamCard
              key={team._id}
              team={team}
              memberCount={memberCount}
              tournament={tournament}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
