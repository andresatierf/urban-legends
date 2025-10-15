type Team = {
  id: string;
  name: string;
  score: number;
};

type UserStatsCardProps = {
  userName: string;
  teams: Team[];
  totalScore: number;
};

export function UserStatsCard({
  userName,
  teams,
  totalScore,
}: UserStatsCardProps) {
  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-xl">
          {userName}'s Dashboard
        </h2>
        <span className="text-gray-500 text-sm">Score Overview</span>
      </div>

      <div className="mb-4">
        <div className="font-bold text-4xl text-blue-600">{totalScore}</div>
        <p className="text-gray-500 text-sm">Total Score</p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-700">Teams</h3>
        <ul className="divide-y divide-gray-100">
          {teams.map((team) => (
            <li
              key={team.id}
              className="flex justify-between py-2 text-gray-700"
            >
              <span>{team.name}</span>
              <span className="font-semibold text-blue-600">{team.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
