type TeamScore = {
  teamName: string;
  score: number;
};

type UserDetailsCardProps = {
  name: string;
  email: string;
  teams: TeamScore[];
};

export const UserDetailsCard: React.FC<UserDetailsCardProps> = ({
  name,
  email,
  teams = [],
}) => {
  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-md">
      <div className="mb-3">
        <h2 className="font-semibold text-gray-800 text-xl">{name}</h2>
        <p className="text-gray-500 text-sm">{email}</p>
      </div>

      <div className="border-gray-100 border-t pt-3">
        <h3 className="mb-2 font-medium text-gray-600 text-sm">
          Teams & Scores
        </h3>
        <ul className="space-y-1">
          {teams.map((team, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm"
            >
              <span className="font-medium text-gray-700">{team.teamName}</span>
              <span className="font-semibold text-blue-600">{team.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
