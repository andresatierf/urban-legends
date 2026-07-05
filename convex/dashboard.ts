import { query } from "./_generated/server";
import { isGlobalAdminOrDev } from "./authority/core";
import { extractDateFromISO, nowUTC } from "./lib/dates";
import { batchGetDocuments, enrichWithRelations, toMap } from "./lib/helpers";
import { getCurrentUserOrThrow } from "./users";

export const getDashboardData = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const isAdmin = await isGlobalAdminOrDev(ctx, user._id);
    const nowIso = nowUTC();
    const todayStr = extractDateFromISO(nowIso);
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

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
          team: { ...team, points: Math.round(team.points ?? 0) },
          tournament,
          memberCount: members.length,
          userRole: membership.role as "captain" | "member",
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    const userTournamentsMap = new Map(
      validTeams.map((t) => [t.tournament._id, t.tournament]),
    );
    const activeTournaments = [...userTournamentsMap.values()].filter(
      (t) => t.startDate <= todayStr && t.endDate >= todayStr,
    );
    const activeTournamentsCount = activeTournaments.length;

    const tournamentsById = new Map(
      validTeams.map((t) => [t.tournament._id, t.tournament]),
    );
    const userTeamIds = new Set(validTeams.map((t) => t.team._id));

    const competingTeamsRaw = (
      await Promise.all(
        Array.from(tournamentsById.keys()).map((tournamentId) =>
          ctx.db
            .query("teams")
            .withIndex("by_tournament", (q) =>
              q.eq("tournamentId", tournamentId),
            )
            .collect(),
        ),
      )
    )
      .flat()
      .filter((team) => !userTeamIds.has(team._id));

    const competingTeams = (
      await Promise.all(
        competingTeamsRaw.map(async (team) => {
          const tournament = tournamentsById.get(team.tournamentId);
          if (!tournament) return null;
          const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();
          return {
            team: { ...team, points: Math.round(team.points ?? 0) },
            tournament,
            memberCount: members.length,
            userRole: "rival" as const,
          };
        }),
      )
    ).filter((t): t is NonNullable<typeof t> => t !== null);

    const allTeamIds = [
      ...validTeams.map((t) => t.team._id),
      ...competingTeams.map((t) => t.team._id),
    ];
    const standingsTimelines = await Promise.all(
      allTeamIds.map(async (teamId) => {
        const approved = await ctx.db
          .query("activities")
          .withIndex("by_team_and_state", (q) =>
            q.eq("teamId", teamId).eq("state", "approved"),
          )
          .collect();
        return {
          teamId,
          events: approved
            .map((a) => ({
              timestamp: new Date(a.date).getTime(),
              points: a.pointsEarned ?? 0,
            }))
            .sort((a, b) => a.timestamp - b.timestamp),
        };
      }),
    );

    const userParticipations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const userActivityIds = Array.from(
      new Set(userParticipations.map((p) => p.activityId)),
    );
    const userActivities = (
      await Promise.all(userActivityIds.map((id) => ctx.db.get(id)))
    ).filter((a): a is NonNullable<typeof a> => a !== null);

    const teamById = new Map(
      [...validTeams, ...competingTeams].map((t) => [t.team._id, t]),
    );

    const pendingActivitiesList = userActivities
      .filter((a) => a.state === "pending" || a.state === "incomplete")
      .map((a) => {
        const t = teamById.get(a.teamId);
        return {
          id: a._id,
          teamName: t?.team.name ?? "Unknown team",
          tournamentName: t?.tournament.name ?? "Unknown tournament",
          date: a.date,
          state: a.state as "pending" | "incomplete" | "approved" | "rejected",
        };
      });

    const userJoinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .collect();

    const invitations = await Promise.all(
      userJoinRequests
        .filter((r) => r.initiator === "team")
        .map(async (r) => {
          const team = await ctx.db.get(r.teamId);
          const tournament = team ? await ctx.db.get(team.tournamentId) : null;
          const inviter = await ctx.db.get(r.createdBy);
          return {
            id: r._id,
            teamName: team?.name ?? "Unknown team",
            tournamentName: tournament?.name ?? "Unknown tournament",
            invitedBy: inviter?.name ?? "A captain",
            timestamp: new Date(r.createdAt).getTime(),
          };
        }),
    );

    const captainMemberships = teamMemberships.filter(
      (m) => m.role === "captain",
    );
    const joinRequestsForCaptain = (
      await Promise.all(
        captainMemberships.map(async (m) => {
          const requests = await ctx.db
            .query("joinRequests")
            .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("initiator"), "user"),
              ),
            )
            .collect();
          return Promise.all(
            requests.map(async (r) => {
              const requester = await ctx.db.get(r.userId);
              const team = teamById.get(r.teamId);
              return {
                id: r._id,
                userName: requester?.name ?? "A user",
                teamName: team?.team.name ?? "Unknown team",
                timestamp: new Date(r.createdAt).getTime(),
              };
            }),
          );
        }),
      )
    ).flat();

    const deadlines = validTeams
      .map((t) => {
        const endMs = new Date(t.tournament.endDate).getTime();
        const daysUntilEnd = Math.ceil((endMs - nowMs) / 86_400_000);
        return { tournament: t.tournament, daysUntilEnd };
      })
      .filter(
        (d) =>
          d.daysUntilEnd >= 0 && d.daysUntilEnd * 86_400_000 <= sevenDaysMs,
      )
      .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      icon: string;
      link?: string;
    }> = [];

    const recentUserActs = [...userActivities]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 20);
    for (const act of recentUserActs) {
      if (act.state === "approved" || act.state === "rejected") {
        const t = teamById.get(act.teamId);
        activities.push({
          type: `activity_${act.state}`,
          description: `Your activity for ${t?.team.name ?? "team"} was ${act.state}`,
          timestamp: act._creationTime,
          icon: act.state === "approved" ? "check-circle" : "x-circle",
          link: `/activities/${act._id}`,
        });
      }
    }

    for (const m of captainMemberships) {
      const team = teamById.get(m.teamId);
      if (!team) continue;
      const resolvedRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "accepted"),
            q.eq(q.field("status"), "rejected"),
          ),
        )
        .order("desc")
        .take(5);
      for (const r of resolvedRequests) {
        if (!r.respondedAt) continue;
        const reqUser = await ctx.db.get(r.userId);
        activities.push({
          type: `join_request_${r.status}`,
          description: `${reqUser?.name ?? "A user"}'s join request for ${team.team.name} was ${r.status}`,
          timestamp: new Date(r.respondedAt).getTime(),
          icon: "users",
          link: `/teams/${team.team._id}`,
        });
      }
      const recentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
        .order("desc")
        .take(5);
      for (const mem of recentMembers) {
        if (mem.userId === user._id) continue;
        const memUser = await ctx.db.get(mem.userId);
        activities.push({
          type: "team_member_joined",
          description: `${memUser?.name ?? "A user"} joined ${team.team.name}`,
          timestamp: mem._creationTime,
          icon: "user-plus",
          link: `/teams/${team.team._id}`,
        });
      }
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);
    const trimmedActivities = activities.slice(0, 15);

    let adminStats: {
      users: { total: number; newThisWeek: number };
      tournaments: {
        total: number;
        active: number;
        upcoming: number;
        ended: number;
      };
      teams: { total: number };
      activities: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
      };
    } | null = null;

    if (isAdmin) {
      const [users, tournaments, teams, activities] = await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("tournaments").collect(),
        ctx.db.query("teams").collect(),
        ctx.db.query("activities").collect(),
      ]);
      const oneWeekAgo = nowMs - sevenDaysMs;
      adminStats = {
        users: {
          total: users.length,
          newThisWeek: users.filter((u) => u._creationTime > oneWeekAgo).length,
        },
        tournaments: {
          total: tournaments.length,
          active: tournaments.filter(
            (t) => t.startDate <= nowIso && t.endDate >= nowIso,
          ).length,
          upcoming: tournaments.filter((t) => t.startDate > nowIso).length,
          ended: tournaments.filter((t) => t.endDate < nowIso).length,
        },
        teams: { total: teams.length },
        activities: {
          total: activities.length,
          pending: activities.filter(
            (a) => a.state === "pending" || a.state === "incomplete",
          ).length,
          approved: activities.filter((a) => a.state === "approved").length,
          rejected: activities.filter((a) => a.state === "rejected").length,
        },
      };
    }

    return {
      userName: user.name ?? "Player",
      isAdmin,
      todayStr,
      teams: validTeams,
      competingTeams,
      activeTournaments,
      activeTournamentsCount,
      pendingActivitiesCount: pendingActivitiesList.length,
      invitationsCount: invitations.length,
      activities: trimmedActivities,
      deadlines,
      invitations,
      pendingActivities: pendingActivitiesList,
      joinRequests: joinRequestsForCaptain,
      adminStats,
      standingsTimelines,
    };
  },
});
