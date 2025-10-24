import type { Id } from "../../convex/_generated/dataModel";
import { TournamentTeams } from "./TournamentTeams";
import { UserStatsCard } from "./UserStatsCard";

interface UserDashboardProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function UserDashboard({ currentPage }: UserDashboardProps) {
  return <UserOverview />;
}

function UserOverview() {
  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">Dashboard</h2>

      <UserStatsCard
        userName="Alex Turner"
        totalScore={2450}
        teams={[
          { id: "1", name: "Frontend Wizards", score: 1200 },
          { id: "2", name: "API Masters", score: 800 },
          { id: "3", name: "QA Crew", score: 450 },
        ]}
      />
      <TournamentTeams
        tournamentId={"ks7a4kbc76rc4nffvw26nxqqw17sgdrs" as Id<"tournaments">}
      />
    </div>
  );
}
