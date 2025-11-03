import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AdminDashboardProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function AdminDashboard({
  currentPage,
  setCurrentPage,
}: AdminDashboardProps) {
  const makeFirstUserAdmin = useMutation(api.admin.makeFirstUserAdmin);

  useEffect(() => {
    makeFirstUserAdmin().then((wasSet) => {
      if (wasSet) {
        toast.success("You have been granted admin privileges!");
      }
    });
  }, [makeFirstUserAdmin]);

  switch (currentPage) {
    case "tournaments":
      return <TournamentsPage />;
    case "teams":
      return <TeamsPage />;
    case "users":
      return <UsersPage />;
    default:
      return <AdminOverview setCurrentPage={setCurrentPage} />;
  }
}

function AdminOverview({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  const tournaments = useQuery(api.tournaments.list) || [];
  const users = useQuery(api.users.list) || [];

  const activeTournaments = tournaments;

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">Admin Dashboard</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 font-semibold text-gray-900 text-lg">
            Active tournaments
          </h3>
          <p className="font-bold text-3xl text-blue-600">
            {activeTournaments.length}
          </p>
          <button
            type="button"
            onClick={() => setCurrentPage("tournaments")}
            className="mt-2 text-blue-600 text-sm hover:text-blue-800"
          >
            Manage tournaments →
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 font-semibold text-gray-900 text-lg">
            Total Users
          </h3>
          <p className="font-bold text-3xl text-green-600">{users.length}</p>
          <button
            type="button"
            onClick={() => setCurrentPage("users")}
            className="mt-2 text-blue-600 text-sm hover:text-blue-800"
          >
            Manage Users →
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 font-semibold text-gray-900 text-lg">Teams</h3>
          <p className="font-bold text-3xl text-purple-600">-</p>
          <button
            type="button"
            onClick={() => setCurrentPage("teams")}
            className="mt-2 text-blue-600 text-sm hover:text-blue-800"
          >
            Manage Teams →
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900 text-lg">
          Recent tournaments
        </h3>
        {tournaments.length === 0 ? (
          <p className="text-gray-500">No tournaments created yet.</p>
        ) : (
          <div className="space-y-2">
            {tournaments.slice(0, 5).map((tournament) => (
              <div
                key={tournament._id}
                className="flex items-center justify-between border-b py-2"
              >
                <div>
                  <h4 className="font-medium">{tournament.name}</h4>
                  <p className="text-gray-500 text-sm">
                    {tournament.startDate} - {tournament.endDate}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    tournament
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {tournament ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentsPage() {
  const tournaments = useQuery(api.tournaments.list) || [];
  const updateTournament = useMutation(api.tournaments.upsert);
  const createTournament = useMutation(api.tournaments.upsert);

  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTournament) {
        await updateTournament({
          id: editingTournament._id,
          ...formData,
          isActive: editingTournament.isActive,
        });
        toast.success("Tournament updated!");
      } else {
        await createTournament(formData);
        toast.success("Tournament created!");
      }
      setShowForm(false);
      setEditingTournament(null);
      setFormData({ name: "", description: "", startDate: "", endDate: "" });
    } catch (_error) {
      toast.error("Failed to save tournament");
    }
  };

  const handleEdit = (tournament: any) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
    });
    setShowForm(true);
  };

  const toggleActive = async (tournament: any) => {
    try {
      await updateTournament({
        id: tournament._id,
        name: tournament.name,
        description: tournament.description,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        isActive: !tournament.isActive,
      });
      toast.success(
        `Tournament ${tournament.isActive ? "deactivated" : "activated"}!`,
      );
    } catch (_error) {
      toast.error("Failed to update tournament");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-3xl text-gray-900">Tournaments</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Tournament
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 font-semibold text-lg">
            {editingTournament ? "Edit Tournament" : "Create New Tournament"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-medium text-gray-700 text-sm">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-gray-700 text-sm">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {editingTournament ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTournament(null);
                  setFormData({
                    name: "",
                    description: "",
                    startDate: "",
                    endDate: "",
                  });
                }}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tournaments.map((tournament) => (
              <tr key={tournament._id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {tournament.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {tournament.description}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {tournament.startDate} - {tournament.endDate}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      tournament.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tournament.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="space-x-2 whitespace-nowrap px-6 py-4 font-medium text-sm">
                  <button
                    onClick={() => handleEdit(tournament)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(tournament)}
                    className={
                      tournament.isActive
                        ? "text-red-600 hover:text-red-900"
                        : "text-green-600 hover:text-green-900"
                    }
                  >
                    {tournament.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamsPage() {
  const tournaments = useQuery(api.tournaments.list) || [];
  const [selectedTournament, setSelectedTournament] =
    useState<Id<"tournaments"> | null>(null);
  const teams =
    useQuery(
      api.teams.list,
      selectedTournament ? { tournamentId: selectedTournament } : "skip",
    ) || [];
  const createTeam = useMutation(api.teams.create);
  const addMember = useMutation(api.teams.addMember);
  const removeMember = useMutation(api.teams.removeMember);

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState<Id<"teams"> | null>(
    null,
  );
  const [teamName, setTeamName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"member" | "captain">("member");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    try {
      await createTeam({
        name: teamName,
        tournamentId: selectedTournament,
      });
      toast.success("Team created!");
      setShowTeamForm(false);
      setTeamName("");
    } catch (_error) {
      toast.error("Failed to create team");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMemberForm) return;

    try {
      await addMember({
        teamId: showMemberForm,
        userEmail: memberEmail,
        role: memberRole,
      });
      toast.success("Member added!");
      setShowMemberForm(null);
      setMemberEmail("");
      setMemberRole("member");
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (
    teamId: Id<"teams">,
    userId: Id<"users">,
  ) => {
    try {
      await removeMember({ teamId, userId });
      toast.success("Member removed!");
    } catch (_error) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">Teams</h2>

      <div className="rounded-lg bg-white p-4 shadow">
        <label className="mb-2 block font-medium text-gray-700 text-sm">
          Select Tournament
        </label>
        <select
          value={selectedTournament || ""}
          onChange={(e) =>
            setSelectedTournament(
              (e.target.value as Id<"tournaments">) || null,
            )
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a tournament...</option>
          {tournaments.map((tournament) => (
            <option key={tournament._id} value={tournament._id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xl">Teams</h3>
            <button
              onClick={() => setShowTeamForm(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Team
            </button>
          </div>

          {showTeamForm && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h4 className="mb-4 font-semibold text-lg">Create New Team</h4>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamForm(false);
                      setTeamName("");
                    }}
                    className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-6">
            {teams.map((team) => (
              <div key={team._id} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{team.name}</h4>
                  <button
                    onClick={() => setShowMemberForm(team._id)}
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                  >
                    Add Member
                  </button>
                </div>

                {showMemberForm === team._id && (
                  <div className="mb-4 rounded bg-gray-50 p-4">
                    <form onSubmit={handleAddMember} className="space-y-3">
                      <div>
                        <label className="mb-1 block font-medium text-gray-700 text-sm">
                          User Email
                        </label>
                        <input
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-medium text-gray-700 text-sm">
                          Role
                        </label>
                        <select
                          value={memberRole}
                          onChange={(e) =>
                            setMemberRole(
                              e.target.value as "member" | "captain",
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="member">Member</option>
                          <option value="captain">Captain</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMemberForm(null);
                            setMemberEmail("");
                            setMemberRole("member");
                          }}
                          className="rounded bg-gray-300 px-3 py-1 text-gray-700 text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="font-medium text-gray-700">
                    Members ({team.members.length})
                  </h5>
                  {team.members.length === 0 ? (
                    <p className="text-gray-500 text-sm">No members yet</p>
                  ) : (
                    <div className="space-y-1">
                      {team.members.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{member.user.email}</span>
                            <span
                              className={`rounded px-2 py-1 text-xs ${
                                member.role === "captain"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {member.role}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveMember(team._id, member.userId)
                            }
                            className="text-red-600 text-sm hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UsersPage() {
  const users = useQuery(api.users.list) || [];
  const setUserRole = useMutation(api.admin.setUserRole);

  const handleRoleChange = async (
    userId: Id<"users">,
    newRole: "admin" | "user",
  ) => {
    try {
      await setUserRole({ userId, role: newRole });
      toast.success("User role updated!");
    } catch (_error) {
      toast.error("Failed to update user role");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl text-gray-900">Users</h2>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(
                        user._id,
                        e.target.value as "admin" | "user",
                      )
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
