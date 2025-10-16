import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import { UserDetailsCard } from "./UserDetailsCard";
import { UserStatsCard } from "./UserStatsCard";
import { TournamentTeams } from "./TournamentTeams";

interface UserDashboardProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function UserDashboard({
  currentPage,
  setCurrentPage,
}: UserDashboardProps) {
  switch (currentPage) {
    case "track":
      return <TrackProgressPage />;
    case "teams":
      return <MyTeamsPage />;
    default:
      return <UserOverview setCurrentPage={setCurrentPage} />;
  }
}

function UserOverview({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  const userTeams = useQuery(api.teams.listByUser) || [];
  const tournaments = useQuery(api.tournaments.list) || [];

  const activeTeams = userTeams.filter((team) => team.tournament?.isActive);

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">Dashboard</h2>

      <UserDetailsCard
        name="name"
        email=""
        teams={[{ teamName: "teamName", score: 5 }]}
      />
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
        tournamentName="Urban Legends 2025 Q4"
        teams={[
          { name: "Alpha Coders", members: 5, score: 1280 },
          { name: "Bug Hunters", members: 4, score: 970 },
          { name: "Dev Ninjas", members: 6, score: 1120 },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 font-semibold text-gray-900 text-lg">
            My Active Teams
          </h3>
          <p className="font-bold text-3xl text-blue-600">
            {activeTeams.length}
          </p>
          <button
            onClick={() => setCurrentPage("teams")}
            className="mt-2 text-blue-600 text-sm hover:text-blue-800"
          >
            View Teams →
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 font-semibold text-gray-900 text-lg">
            Active Tournaments
          </h3>
          <p className="font-bold text-3xl text-green-600">
            {tournaments.filter((c) => c.isActive).length}
          </p>
          <button
            onClick={() => setCurrentPage("track")}
            className="mt-2 text-blue-600 text-sm hover:text-blue-800"
          >
            Track Progress →
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900 text-lg">My Teams</h3>
        {userTeams.length === 0 ? (
          <p className="text-gray-500">
            You're not part of any teams yet. Contact an admin to be added to a
            team.
          </p>
        ) : (
          <div className="space-y-3">
            {userTeams.map((team) => (
              <div
                key={team._id}
                className="flex items-center justify-between border-b py-3"
              >
                <div>
                  <h4 className="font-medium">{team.name}</h4>
                  <p className="text-gray-500 text-sm">
                    {team.tournament?.name} • {team.role}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    team.tournament?.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {team.tournament?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrackProgressPage() {
  const userTeams = useQuery(api.teams.getUserTeams) || [];
  const [selectedTeam, setSelectedTeam] = useState<Id<"teams"> | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTeammates, _setSelectedTeammates] = useState<Id<"users">[]>(
    [],
  );

  const markCompletion = useMutation(api.submissions.markCompletion);

  const selectedTeamData = userTeams.find((team) => team._id === selectedTeam);
  const activeTeams = userTeams.filter((team) => team.tournament?.isActive);

  // Get completions for the selected team and date range
  const startDate = selectedTeamData?.tournament?.startDate || selectedDate;
  const endDate = selectedTeamData?.tournament?.endDate || selectedDate;

  const completions =
    useQuery(
      api.submissions.getUserCompletions,
      selectedTeam ? { teamId: selectedTeam, startDate, endDate } : "skip",
    ) || [];

  const teamCompletions =
    useQuery(
      api.submissions.getTeamCompletions,
      selectedTeam ? { teamId: selectedTeam, date: selectedDate } : "skip",
    ) || [];

  const todayCompletion = completions.find((c) => c.date === selectedDate);

  const handleMarkCompletion = async (completed: boolean) => {
    if (!selectedTeam) return;

    try {
      await markCompletion({
        teamId: selectedTeam,
        date: selectedDate,
        completed,
        teammates: selectedTeammates,
      });
      toast.success(
        completed
          ? "Task marked as completed!"
          : "Task marked as not completed!",
      );
    } catch (_error) {
      toast.error("Failed to update completion status");
    }
  };

  const generateDateRange = (start: string, end: string) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    return dates;
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">Track Progress</h2>

      {activeTeams.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <p className="text-gray-500">
            You're not part of any active teams. Contact an admin to be added to
            a team.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-white p-4 shadow">
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Select Team
            </label>
            <select
              value={selectedTeam || ""}
              onChange={(e) =>
                setSelectedTeam((e.target.value as Id<"teams">) || null)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a team...</option>
              {activeTeams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name} - {team.tournament?.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && selectedTeamData && (
            <>
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-lg">
                  Mark Today's Completion
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block font-medium text-gray-700 text-sm">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={selectedTeamData.tournament?.startDate}
                      max={selectedTeamData.tournament?.endDate}
                      className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-gray-700 text-sm">
                      Teammates who completed with you (optional)
                    </label>
                    <div className="mb-2 text-gray-500 text-sm">
                      Select teammates who completed the task with you on this
                      day
                    </div>
                    {/* Note: We'd need to fetch team members here, but for simplicity, we'll show a text input */}
                    <p className="text-gray-400 text-sm">
                      Teammate selection feature coming soon...
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleMarkCompletion(true)}
                      className={`rounded-md px-4 py-2 font-medium ${
                        todayCompletion?.completed
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      ✓ Completed
                    </button>
                    <button
                      onClick={() => handleMarkCompletion(false)}
                      className={`rounded-md px-4 py-2 font-medium ${
                        todayCompletion && !todayCompletion.completed
                          ? "bg-red-600 text-white"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      ✗ Not Completed
                    </button>
                  </div>

                  {todayCompletion && (
                    <div className="mt-4 rounded bg-gray-50 p-3">
                      <p className="text-sm">
                        Status for {selectedDate}:
                        <span
                          className={`ml-2 font-medium ${
                            todayCompletion.completed
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {todayCompletion.completed
                            ? "Completed"
                            : "Not Completed"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-lg">
                  Team Progress for {selectedDate}
                </h3>
                {teamCompletions.length === 0 ? (
                  <p className="text-gray-500">
                    No completions recorded for this date.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {teamCompletions.map((completion) => (
                      <div
                        key={completion._id}
                        className="flex items-center justify-between border-b py-2"
                      >
                        <span className="font-medium">
                          {completion.user.email}
                        </span>
                        <span className="text-green-600">✓ Completed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-lg">
                  Your Progress Calendar
                </h3>
                {selectedTeamData.tournament && (
                  <div className="grid grid-cols-7 gap-2">
                    {generateDateRange(
                      selectedTeamData.tournament.startDate,
                      selectedTeamData.tournament.endDate,
                    ).map((date) => {
                      const completion = completions.find(
                        (c) => c.date === date,
                      );
                      const isToday =
                        date === new Date().toISOString().split("T")[0];

                      return (
                        <div
                          key={date}
                          className={`rounded border p-2 text-center text-xs ${
                            completion?.completed
                              ? "border-green-300 bg-green-100 text-green-800"
                              : completion && !completion.completed
                                ? "border-red-300 bg-red-100 text-red-800"
                                : isToday
                                  ? "border-blue-300 bg-blue-100 text-blue-800"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          {new Date(date).getDate()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MyTeamsPage() {
  const userTeams = useQuery(api.teams.getUserTeams) || [];
  const tournament = useQuery(api.tournament.list) || [];

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">My Teams</h2>

      {userTeams.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <p className="text-gray-500">
            You're not part of any teams yet. Contact an admin to be added to a
            team.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {userTeams.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: any }) {
  const leaderboard =
    useQuery(api.tournaments.getLeaderboard, {
      tournamentId: team.tournament?.id,
    }) || [];

  const teamRank =
    leaderboard.findIndex((entry) => entry.team._id === team._id) + 1;
  const teamStats = leaderboard.find((entry) => entry.team._id === team._id);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{team.name}</h3>
          <p className="text-gray-600">{team.tournament?.name}</p>
          <p className="text-gray-500 text-sm">
            {team.tournament?.startDate} - {team.tournament?.endDate}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              team.tournament?.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {team.tournament?.isActive ? "Active" : "Inactive"}
          </span>
          <p className="mt-1 text-gray-500 text-sm">Your role: {team.role}</p>
        </div>
      </div>

      {team.tournament?.isActive && teamStats && (
        <div className="rounded bg-gray-50 p-4">
          <h4 className="mb-2 font-medium">Team Performance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Completed Days:</span>
              <span className="ml-2 font-semibold">
                {teamStats.completedDays}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Team Rank:</span>
              <span className="ml-2 font-semibold">#{teamRank}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
