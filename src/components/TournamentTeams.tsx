type Team = {
  name: string;
  members: number;
  score: number;
};

type TournamentTeamsProps = {
  tournamentName: string;
  teams: Team[];
};

export function TournamentTeams({
  tournamentName,
  teams,
}: TournamentTeamsProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-xl">
          {tournamentName} Teams
        </h2>
        <span className="text-gray-500 text-sm">
          {teams.length} teams participating
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm uppercase tracking-wider">
              <th className="p-3">Team</th>
              <th className="p-3">Members</th>
              <th className="p-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.name}
                className="border-t transition hover:bg-gray-50"
              >
                <td className="p-3 font-medium text-gray-800">{team.name}</td>
                <td className="p-3 text-gray-600">{team.members}</td>
                <td className="p-3 font-semibold text-blue-600">
                  {team.score}
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No teams registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
