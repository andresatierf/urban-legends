"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { useMemo } from "react";

interface UserDashboardProps {
  currentPage?: string;
  setCurrentPage?: (page: string) => void;
}

export function UserDashboard(_props: UserDashboardProps) {
  // Fetch current user
  const currentUser = useQuery(api.users.current);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return currentUser?.roles?.includes("admin") ?? false;
  }, [currentUser]);

  // Fetch user's teams
  const userTeams = useQuery(
    api.teams.list,
    currentUser ? { userId: currentUser._id } : "skip",
  );

  // Fetch all tournaments
  const tournaments = useQuery(api.tournaments.list);

  // Fetch user's submissions
  const userSubmissions = useQuery(api.submissions.listUserSubmissions, {});

  // Fetch team members for all user's teams
  const teamMembers = useQuery(
    api.teams.listMembers,
    userTeams && userTeams.length > 0
      ? { teamIds: userTeams.map((t) => t._id) }
      : "skip",
  );

  // Admin-only: Fetch all users
  const allUsers = useQuery(api.users.list, isAdmin ? {} : "skip");

  // Admin-only: Fetch all teams
  const allTeams = useQuery(api.teams.list, isAdmin ? {} : "skip");

  // Admin-only: Fetch all submissions for review
  const allSubmissions = useQuery(api.submissions.list, isAdmin ? {} : "skip");

  // Calculate stats
  const stats = useMemo(() => {
    const teamsCount = userTeams?.length || 0;
    const pendingSubmissions =
      userSubmissions?.filter((s) => s.state === "pending").length || 0;

    // Get unique tournament IDs from user's teams
    const userTournamentIds = new Set(userTeams?.map((t) => t.tournamentId));

    // Filter active tournaments where user has a team
    const activeTournaments =
      tournaments?.filter((t) => {
        if (!userTournamentIds.has(t._id)) return false;
        const today = new Date().toISOString().split("T")[0];
        return t.startDate <= today && t.endDate >= today;
      }).length || 0;

    return {
      teamsCount,
      pendingSubmissions,
      activeTournaments,
    };
  }, [userTeams, userSubmissions, tournaments]);

  // Calculate admin stats
  const adminStats = useMemo(() => {
    if (!isAdmin) return null;

    const totalTournaments = tournaments?.length || 0;
    const totalTeams = allTeams?.length || 0;
    const totalUsers = allUsers?.length || 0;
    const pendingReviews =
      allSubmissions?.filter((s) => s.state === "pending").length || 0;

    return {
      totalTournaments,
      totalTeams,
      totalUsers,
      pendingReviews,
    };
  }, [isAdmin, tournaments, allTeams, allUsers, allSubmissions]);

  // Map tournaments by ID for easy lookup
  const tournamentMap = useMemo(() => {
    const map = new Map();
    tournaments?.forEach((t) => map.set(t._id, t));
    return map;
  }, [tournaments]);

  // Get recent submissions (last 5)
  const recentSubmissions = useMemo(() => {
    if (!userSubmissions) return [];
    return userSubmissions.slice(0, 5);
  }, [userSubmissions]);

  if (!currentUser) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="font-bold text-3xl text-gray-900">
          Welcome back, {currentUser.name || "User"}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your tournament activity
        </p>
      </div>

      {/* Admin Section */}
      {isAdmin && adminStats && (
        <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h2 className="font-semibold text-gray-900 text-xl">
              Admin Overview
            </h2>
          </div>

          {/* Admin Stats Grid */}
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-gray-600 text-xs">Total Tournaments</p>
              <p className="font-bold text-2xl text-gray-900">
                {adminStats.totalTournaments}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-gray-600 text-xs">Total Teams</p>
              <p className="font-bold text-2xl text-gray-900">
                {adminStats.totalTeams}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-gray-600 text-xs">Total Users</p>
              <p className="font-bold text-2xl text-gray-900">
                {adminStats.totalUsers}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-gray-600 text-xs">Pending Reviews</p>
              <p className="font-bold text-2xl text-purple-600">
                {adminStats.pendingReviews}
              </p>
            </div>
          </div>

          {/* Admin Quick Actions */}
          <div>
            <p className="mb-2 font-medium text-gray-700 text-sm">
              Admin Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-md bg-purple-600 px-3 py-2 text-sm text-white transition-colors hover:bg-purple-700"
              >
                Admin Dashboard
              </Link>
              <Link
                href="/admin/tournaments"
                className="rounded-md bg-white px-3 py-2 text-purple-700 text-sm shadow-sm transition-shadow hover:shadow-md"
              >
                Manage Tournaments
              </Link>
              <Link
                href="/admin/teams"
                className="rounded-md bg-white px-3 py-2 text-purple-700 text-sm shadow-sm transition-shadow hover:shadow-md"
              >
                Manage Teams
              </Link>
              <Link
                href="/admin/users"
                className="rounded-md bg-white px-3 py-2 text-purple-700 text-sm shadow-sm transition-shadow hover:shadow-md"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">My Teams</p>
              <p className="font-bold text-2xl text-gray-900">
                {stats.teamsCount}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Tournaments</p>
              <p className="font-bold text-2xl text-gray-900">
                {stats.activeTournaments}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Submissions</p>
              <p className="font-bold text-2xl text-gray-900">
                {stats.pendingSubmissions}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* My Teams Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-xl">My Teams</h2>
          <Link
            href="/teams"
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            View all →
          </Link>
        </div>

        {!userTeams || userTeams.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500">You're not part of any teams yet</p>
            <Link
              href="/teams"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Browse Teams
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userTeams.map((team) => {
              const tournament = tournamentMap.get(team.tournamentId);
              const members = teamMembers?.filter((m) => m.teamId === team._id);
              const today = new Date().toISOString().split("T")[0];
              const isActive =
                tournament &&
                tournament.startDate <= today &&
                tournament.endDate >= today;

              return (
                <div
                  key={team._id}
                  className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {team.name}
                      </h3>
                      {tournament && (
                        <p className="mt-1 text-gray-600 text-sm">
                          {tournament.name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          {members?.length || 0} members
                        </span>
                        {tournament && (
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/teams/${team._id}`}
                      className="text-blue-600 text-sm hover:text-blue-800"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Submissions Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-xl">
            Recent Submissions
          </h2>
          <Link
            href="/submissions"
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            View all →
          </Link>
        </div>

        {!recentSubmissions || recentSubmissions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500">No submissions yet</p>
            <Link
              href="/submissions"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Submission
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentSubmissions.map((submission) => (
                  <tr key={submission._id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900 text-sm">
                      {submission.date}
                    </td>
                    <td className="px-4 py-3 text-gray-900 text-sm">
                      {submission.description || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          submission.state === "approved"
                            ? "bg-green-100 text-green-800"
                            : submission.state === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : submission.state === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {submission.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 font-medium text-gray-900">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tournaments"
            className="rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm transition-shadow hover:shadow-md"
          >
            Browse Tournaments
          </Link>
          <Link
            href="/teams"
            className="rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm transition-shadow hover:shadow-md"
          >
            Manage Teams
          </Link>
          <Link
            href="/submissions"
            className="rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm transition-shadow hover:shadow-md"
          >
            My Submissions
          </Link>
        </div>
      </div>
    </div>
  );
}
