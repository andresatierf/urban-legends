import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Props = {
  tournamentId: Id<"tournaments">;
};

export function TournamentTeams({ tournamentId }: Props) {
  const tournament = useQuery(api.tournaments.get, { tournamentId });
  const teams = useQuery(api.teams.list, { tournamentId }) || [];
  const teamIds = teams.map((t) => t._id);
  const teamMembers = useQuery(
    api.teams.listMembers,
    teamIds.length > 0 ? { teamIds } : "skip",
  );
  const allUsers = useQuery(api.users.list, {});

  const teamsWithMembers = useMemo(() => {
    if (!teamMembers || !allUsers) return teams.map((t) => ({ ...t, memberEmails: [] }));

    return teams.map((team) => {
      const members = teamMembers.filter((m) => m.teamId === team._id);
      const memberEmails = members
        .map((m) => {
          const user = allUsers.find((u) => u._id === m.userId);
          return user?.email;
        })
        .filter((email): email is string => email !== undefined);

      return {
        ...team,
        memberEmails,
      };
    });
  }, [teams, teamMembers, allUsers]);

  if (!tournament) return null; // TODO: add skeleton

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-xl">
          {tournament.name} Teams
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
            {teamsWithMembers.map((team) => (
              <tr
                key={team.name}
                className="border-t transition hover:bg-gray-50"
              >
                <td className="p-3 font-medium text-gray-800">{team.name}</td>
                <td className="p-3 text-gray-600">
                  {team.memberEmails.join(", ")}
                </td>
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
