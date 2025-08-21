import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface UserDashboardProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function UserDashboard({ currentPage, setCurrentPage }: UserDashboardProps) {
  switch (currentPage) {
    case "track":
      return <TrackProgressPage />;
    case "teams":
      return <MyTeamsPage />;
    default:
      return <UserOverview setCurrentPage={setCurrentPage} />;
  }
}

function UserOverview({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const userTeams = useQuery(api.teams.getUserTeams) || [];
  const competitions = useQuery(api.competitions.list) || [];

  const activeTeams = userTeams.filter(team => team.competition?.isActive);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">My Active Teams</h3>
          <p className="text-3xl font-bold text-blue-600">{activeTeams.length}</p>
          <button
            onClick={() => setCurrentPage("teams")}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            View Teams →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Competitions</h3>
          <p className="text-3xl font-bold text-green-600">
            {competitions.filter(c => c.isActive).length}
          </p>
          <button
            onClick={() => setCurrentPage("track")}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Track Progress →
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Teams</h3>
        {userTeams.length === 0 ? (
          <p className="text-gray-500">You're not part of any teams yet. Contact an admin to be added to a team.</p>
        ) : (
          <div className="space-y-3">
            {userTeams.map((team) => (
              <div key={team._id} className="flex justify-between items-center py-3 border-b">
                <div>
                  <h4 className="font-medium">{team.name}</h4>
                  <p className="text-sm text-gray-500">
                    {team.competition?.name} • {team.role}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  team.competition?.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {team.competition?.isActive ? "Active" : "Inactive"}
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeammates, setSelectedTeammates] = useState<Id<"users">[]>([]);

  const markCompletion = useMutation(api.completions.markCompletion);

  const selectedTeamData = userTeams.find(team => team._id === selectedTeam);
  const activeTeams = userTeams.filter(team => team.competition?.isActive);

  // Get completions for the selected team and date range
  const startDate = selectedTeamData?.competition?.startDate || selectedDate;
  const endDate = selectedTeamData?.competition?.endDate || selectedDate;
  
  const completions = useQuery(
    api.completions.getUserCompletions,
    selectedTeam ? { teamId: selectedTeam, startDate, endDate } : "skip"
  ) || [];

  const teamCompletions = useQuery(
    api.completions.getTeamCompletions,
    selectedTeam ? { teamId: selectedTeam, date: selectedDate } : "skip"
  ) || [];

  const todayCompletion = completions.find(c => c.date === selectedDate);

  const handleMarkCompletion = async (completed: boolean) => {
    if (!selectedTeam) return;

    try {
      await markCompletion({
        teamId: selectedTeam,
        date: selectedDate,
        completed,
        teammates: selectedTeammates,
      });
      toast.success(completed ? "Task marked as completed!" : "Task marked as not completed!");
    } catch (error) {
      toast.error("Failed to update completion status");
    }
  };

  const generateDateRange = (start: string, end: string) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Track Progress</h2>

      {activeTeams.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">You're not part of any active teams. Contact an admin to be added to a team.</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
            <select
              value={selectedTeam || ""}
              onChange={(e) => setSelectedTeam(e.target.value as Id<"teams"> || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a team...</option>
              {activeTeams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name} - {team.competition?.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && selectedTeamData && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Mark Today's Completion</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={selectedTeamData.competition?.startDate}
                      max={selectedTeamData.competition?.endDate}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teammates who completed with you (optional)
                    </label>
                    <div className="text-sm text-gray-500 mb-2">
                      Select teammates who completed the task with you on this day
                    </div>
                    {/* Note: We'd need to fetch team members here, but for simplicity, we'll show a text input */}
                    <p className="text-sm text-gray-400">
                      Teammate selection feature coming soon...
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleMarkCompletion(true)}
                      className={`px-4 py-2 rounded-md font-medium ${
                        todayCompletion?.completed
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      ✓ Completed
                    </button>
                    <button
                      onClick={() => handleMarkCompletion(false)}
                      className={`px-4 py-2 rounded-md font-medium ${
                        todayCompletion && !todayCompletion.completed
                          ? "bg-red-600 text-white"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      ✗ Not Completed
                    </button>
                  </div>

                  {todayCompletion && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        Status for {selectedDate}: 
                        <span className={`ml-2 font-medium ${
                          todayCompletion.completed ? "text-green-600" : "text-red-600"
                        }`}>
                          {todayCompletion.completed ? "Completed" : "Not Completed"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Team Progress for {selectedDate}</h3>
                {teamCompletions.length === 0 ? (
                  <p className="text-gray-500">No completions recorded for this date.</p>
                ) : (
                  <div className="space-y-2">
                    {teamCompletions.map((completion) => (
                      <div key={completion._id} className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">{completion.user.email}</span>
                        <span className="text-green-600">✓ Completed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Your Progress Calendar</h3>
                {selectedTeamData.competition && (
                  <div className="grid grid-cols-7 gap-2">
                    {generateDateRange(
                      selectedTeamData.competition.startDate,
                      selectedTeamData.competition.endDate
                    ).map((date) => {
                      const completion = completions.find(c => c.date === date);
                      const isToday = date === new Date().toISOString().split('T')[0];
                      
                      return (
                        <div
                          key={date}
                          className={`p-2 text-center text-xs rounded border ${
                            completion?.completed
                              ? "bg-green-100 border-green-300 text-green-800"
                              : completion && !completion.completed
                              ? "bg-red-100 border-red-300 text-red-800"
                              : isToday
                              ? "bg-blue-100 border-blue-300 text-blue-800"
                              : "bg-gray-50 border-gray-200 text-gray-600"
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
  const competitions = useQuery(api.competitions.list) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">My Teams</h2>

      {userTeams.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">You're not part of any teams yet. Contact an admin to be added to a team.</p>
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
  const leaderboard = useQuery(
    api.competitions.getLeaderboard,
    { competitionId: team.competition?.id }
  ) || [];

  const teamRank = leaderboard.findIndex(entry => entry.team._id === team._id) + 1;
  const teamStats = leaderboard.find(entry => entry.team._id === team._id);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{team.name}</h3>
          <p className="text-gray-600">{team.competition?.name}</p>
          <p className="text-sm text-gray-500">
            {team.competition?.startDate} - {team.competition?.endDate}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 text-xs rounded-full ${
            team.competition?.isActive 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-800"
          }`}>
            {team.competition?.isActive ? "Active" : "Inactive"}
          </span>
          <p className="text-sm text-gray-500 mt-1">Your role: {team.role}</p>
        </div>
      </div>

      {team.competition?.isActive && teamStats && (
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-medium mb-2">Team Performance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Completed Days:</span>
              <span className="ml-2 font-semibold">{teamStats.completedDays}</span>
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
