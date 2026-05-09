import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { isGlobalAdminOrDev } from "./authority/core";
import { nowUTC } from "./lib/dates";
import { batchGetDocuments, enrichWithRelations, toMap } from "./lib/helpers";
import { getCurrentUserOrThrow } from "./users";

export const getUserDashboardData = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const teamIds = teamMemberships.map((m) => m.teamId);
    const validTeamsData = await batchGetDocuments(ctx, "teams", teamIds);

    const enrichedTeams = await enrichWithRelations(ctx, validTeamsData, {
      tournament: {
        table: "tournaments",
        foreignKey: (team) => team.tournamentId,
      },
      members: { table: "teamMembers", foreignKeyField: "teamId" },
    });

    const membershipByTeamId = toMap(teamMemberships, "teamId");

    const validTeams = enrichedTeams
      .map((enrichedTeam) => {
        const { tournament, members, ...team } = enrichedTeam;
        const membership = membershipByTeamId.get(team._id);
        if (!tournament || !membership) return null;

        return {
          team,
          tournament,
          memberCount: members.length,
          userRole: membership.role,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    const now = nowUTC();
    const activeTournaments = validTeams.filter(
      (t) => t.tournament.startDate <= now && t.tournament.endDate >= now,
    );

    const userSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pendingSubmissions = userSubmissions.filter(
      (s) => s.state === "pending",
    );

    const allPendingForUser = await ctx.db
      .query("joinRequests")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .collect();
    const invitations = allPendingForUser.filter((r) => r.initiator === "team");

    return {
      teams: validTeams,
      activeTournamentsCount: activeTournaments.length,
      pendingSubmissionsCount: pendingSubmissions.length,
      invitationsCount: invitations.length,
    };
  },
});

export const getAdminDashboardData = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await isGlobalAdminOrDev(ctx, user._id))) {
      return null;
    }

    // TODO: Optimize for scale - Replace .collect() with aggregations/counts
    // For large datasets, this loads all records into memory. Consider:
    // - Using filtered queries with limits
    // - Implementing counters updated on writes
    // - Caching results in a separate table
    // - Using Convex aggregations when available
    // This is acceptable for MVP with small datasets (<10k records)

    const [users, tournaments, teams, submissions] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("tournaments").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("submissions").collect(),
    ]);

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsersThisWeek = users.filter(
      (u) => u._creationTime > oneWeekAgo,
    ).length;

    const now = nowUTC();
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    const pendingSubmissions = submissions.filter((s) => s.state === "pending");
    const approvedSubmissions = submissions.filter(
      (s) => s.state === "approved",
    );
    const rejectedSubmissions = submissions.filter(
      (s) => s.state === "rejected",
    );

    return {
      users: {
        total: users.length,
        newThisWeek: newUsersThisWeek,
      },
      tournaments: {
        total: tournaments.length,
        active: activeTournaments.length,
        upcoming: upcomingTournaments.length,
        ended: endedTournaments.length,
      },
      teams: {
        total: teams.length,
      },
      submissions: {
        total: submissions.length,
        pending: pendingSubmissions.length,
        approved: approvedSubmissions.length,
        rejected: rejectedSubmissions.length,
      },
    };
  },
});

export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit ?? 15;

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      icon: string;
      link?: string;
    }> = [];

    const userSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    for (const sub of userSubmissions) {
      if (sub.state === "approved" || sub.state === "rejected") {
        const team = await ctx.db.get(sub.teamId);
        activities.push({
          type: `submission_${sub.state}`,
          description: `Your submission for ${team?.name ?? "team"} was ${sub.state}`,
          timestamp: sub._creationTime,
          icon: sub.state === "approved" ? "check-circle" : "x-circle",
          link: `/submissions/${sub._id}`,
        });
      }
    }

    const captainTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    for (const membership of captainTeams) {
      const team = await ctx.db.get(membership.teamId);
      if (!team) continue;

      const joinRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "rejected"),
          ),
        )
        .order("desc")
        .take(5);

      for (const req of joinRequests) {
        if (req.respondedAt) {
          const requestUser = await ctx.db.get(req.userId);
          activities.push({
            type: `join_request_${req.status}`,
            description: `${requestUser?.name ?? "A user"}'s join request for ${team.name} was ${req.status}`,
            timestamp: new Date(req.respondedAt).getTime(),
            icon: "users",
            link: `/teams/${team._id}`,
          });
        }
      }

      const recentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .order("desc")
        .take(5);

      for (const member of recentMembers) {
        if (member.userId !== user._id) {
          const memberUser = await ctx.db.get(member.userId);
          activities.push({
            type: "team_member_joined",
            description: `${memberUser?.name ?? "A user"} joined ${team.name}`,
            timestamp: member._creationTime,
            icon: "user-plus",
            link: `/teams/${team._id}`,
          });
        }
      }
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});

export const getUpcomingDeadlines = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const tournamentIds = new Set<string>();
    for (const membership of teamMemberships) {
      const team = await ctx.db.get(membership.teamId);
      if (team) {
        tournamentIds.add(team.tournamentId);
      }
    }

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const tournamentPromises = Array.from(tournamentIds).map((id) =>
      ctx.db.get(id as Id<"tournaments">),
    );
    const tournaments = await Promise.all(tournamentPromises);

    const upcomingDeadlines = tournaments
      .filter((t): t is NonNullable<typeof t> => {
        if (!t) return false;
        const endDate = new Date(t.endDate);
        return endDate >= now && endDate <= sevenDaysFromNow;
      })
      .map((t) => {
        const endDate = new Date(t.endDate);
        const daysUntilEnd = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          tournament: t,
          daysUntilEnd,
        };
      })
      .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

    return upcomingDeadlines;
  },
});
