import { createFileRoute } from "@tanstack/react-router";

import { TeamCard } from "@/components/teams/card/layout";
import type { TeamCardData } from "@/components/teams/card/types";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/dev/team-cards")({
  component: TeamCardsWorkbenchPage,
});

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

type DayCounts = { approved: number; pending: number; rejected: number };

function buildRecentActivity(
  daysFromOldest: DayCounts[],
): NonNullable<Doc<"teams">["recentActivity"]> {
  return {
    updatedAt: new Date().toISOString(),
    days: daysFromOldest.map((counts, i) => ({
      date: daysAgoISO(6 - i),
      ...counts,
    })),
  };
}

function mockTeam(
  id: string,
  name: string,
  points: number,
  recentActivity: Doc<"teams">["recentActivity"],
): Doc<"teams"> {
  return {
    _id: id as Id<"teams">,
    _creationTime: Date.now(),
    name,
    tournamentId: "mockTournament" as Id<"tournaments">,
    createdBy: "mockUser" as Id<"users">,
    joinPolicy: "open",
    maxMembers: 6,
    points,
    lastActivityAt: new Date().toISOString(),
    recentActivity,
  };
}

function mockData(team: Doc<"teams">): TeamCardData {
  return {
    team,
    tournament: undefined,
    members: [
      { _id: "u1", name: "Alex Rivera", memberRole: "captain" },
      { _id: "u2", name: "Sam Patel", memberRole: "member" },
      { _id: "u3", name: "Jordan Kim", memberRole: "member" },
    ],
    memberCount: 3,
    isUserMember: false,
    isUserInTeam: false,
    userRole: null,
  };
}

const hotTeam = mockTeam(
  "team-hot",
  "Hot Streak",
  1840,
  buildRecentActivity([
    { approved: 3, pending: 1, rejected: 0 },
    { approved: 4, pending: 0, rejected: 0 },
    { approved: 2, pending: 2, rejected: 0 },
    { approved: 5, pending: 1, rejected: 1 },
    { approved: 3, pending: 0, rejected: 0 },
    { approved: 4, pending: 2, rejected: 0 },
    { approved: 2, pending: 3, rejected: 0 },
  ]),
);

const coldTeam = mockTeam(
  "team-cold",
  "Gone Quiet",
  420,
  buildRecentActivity([
    { approved: 2, pending: 0, rejected: 0 },
    { approved: 3, pending: 1, rejected: 0 },
    { approved: 1, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
  ]),
);

const rejectedTeam = mockTeam(
  "team-rejected",
  "Bad Week",
  60,
  buildRecentActivity([
    { approved: 1, pending: 0, rejected: 3 },
    { approved: 0, pending: 1, rejected: 4 },
    { approved: 0, pending: 0, rejected: 2 },
    { approved: 1, pending: 0, rejected: 5 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 2, rejected: 3 },
    { approved: 1, pending: 0, rejected: 2 },
  ]),
);

function TeamCardsWorkbenchPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-h2">Team cards · activity bars</h2>
        <p className="text-muted-foreground text-sm">
          Three mock cards covering the activity-bar visualisation extremes:
          hot, cold, and rejection-heavy.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-h3">Hot team</h3>
          <TeamCard data={mockData(hotTeam)} />
        </div>
        <div className="space-y-2">
          <h3 className="text-h3">Cold team</h3>
          <TeamCard data={mockData(coldTeam)} />
        </div>
        <div className="space-y-2">
          <h3 className="text-h3">Just rejected</h3>
          <TeamCard data={mockData(rejectedTeam)} />
        </div>
      </section>
    </div>
  );
}
