import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { extractDateFromISO, nowUTC } from "../lib/dates";
import { getCurrentUserOrThrow } from "../users";

const DAY_MS = 86_400_000;
const GRACE_DAYS = 7;
const URGENT_DAYS = 3;

type LifecycleState = "active" | "urgent" | "ended";

function lifecycleFor(
  tournament: Pick<Doc<"tournaments">, "startDate" | "endDate">,
  todayStr: string,
): LifecycleState | "upcoming" | "ended-stale" {
  if (tournament.startDate > todayStr) return "upcoming";
  if (tournament.endDate < todayStr) {
    const endMs = new Date(tournament.endDate).getTime();
    return Date.now() - endMs < GRACE_DAYS * DAY_MS ? "ended" : "ended-stale";
  }
  const endMs = new Date(tournament.endDate).getTime();
  const daysLeft = Math.ceil((endMs - Date.now()) / DAY_MS);
  return daysLeft <= URGENT_DAYS ? "urgent" : "active";
}

export const getDashboardView = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const todayStr = extractDateFromISO(nowUTC());

    // ── viewer's team memberships ────────────────────────────────────────
    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const viewerTeams = (
      await Promise.all(
        teamMemberships.map(async (m) => {
          const team = await ctx.db.get(m.teamId);
          const tournament = team ? await ctx.db.get(team.tournamentId) : null;
          if (!team || !tournament) return null;
          return { team, tournament, role: m.role as "captain" | "member" };
        }),
      )
    ).filter((t): t is NonNullable<typeof t> => t !== null);

    // ── switchable tournaments: active + ended within grace ─────────────
    const switchable = viewerTeams
      .map(({ tournament }) => {
        const state = lifecycleFor(tournament, todayStr);
        if (state === "upcoming" || state === "ended-stale") return null;
        return { tournament, state };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    // Dedupe — a user has at most one team per tournament, so this is mostly
    // defensive against malformed state.
    const switchableUnique = Array.from(
      new Map(switchable.map((s) => [s.tournament._id, s])).values(),
    ).sort((a, b) => {
      if (a.state !== b.state) return a.state === "ended" ? 1 : -1;
      const byStart = a.tournament.startDate.localeCompare(
        b.tournament.startDate,
      );
      if (byStart !== 0) return byStart;
      return a.tournament.endDate.localeCompare(b.tournament.endDate);
    });

    if (switchableUnique.length === 0) {
      return {
        viewer: { firstName: firstName(user.name) },
        isOnAnyTeam: viewerTeams.length > 0,
        switchableTournaments: [],
        selected: null,
        inbox: await loadInbox(ctx, user._id, teamMemberships),
      } as const;
    }

    // ── pick selected tournament ─────────────────────────────────────────
    const selected =
      switchableUnique.find((s) => s.tournament._id === args.tournamentId) ??
      switchableUnique[0];
    const selectedTournament = selected.tournament;
    const lifecycle = selected.state;

    // ── all teams in selected tournament ─────────────────────────────────
    const allTeams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", selectedTournament._id),
      )
      .collect();

    const teamsEnriched = await Promise.all(
      allTeams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        const viewerMembership = members.find((m) => m.userId === user._id);
        return {
          team: { ...team, points: Math.round(team.points ?? 0) },
          memberCount: members.length,
          userRole: (viewerMembership?.role ?? "rival") as
            | "captain"
            | "member"
            | "rival",
        };
      }),
    );

    teamsEnriched.sort((a, b) => b.team.points - a.team.points);

    const myTeamIndex = teamsEnriched.findIndex((t) => t.userRole !== "rival");
    if (myTeamIndex === -1) {
      // Viewer is in the tournament-switchable set but somehow not in any
      // team here — shouldn't happen, but degrade gracefully.
      return {
        viewer: { firstName: firstName(user.name) },
        isOnAnyTeam: viewerTeams.length > 0,
        switchableTournaments: switchableUnique.map((s) => ({
          _id: s.tournament._id,
          name: s.tournament.name,
          lifecycleState: s.state,
        })),
        selected: null,
        inbox: await loadInbox(ctx, user._id, teamMemberships),
      } as const;
    }

    const myTeamRow = teamsEnriched[myTeamIndex];
    const myRank = myTeamIndex + 1;
    const above = myRank > 1 ? teamsEnriched[myRank - 2] : null;
    const below = myRank < teamsEnriched.length ? teamsEnriched[myRank] : null;
    const comparison: "ahead" | "tied" | "behind" =
      above === null
        ? "ahead"
        : above.team.points === myTeamRow.team.points
          ? "tied"
          : "behind";
    const comparedTo = above ?? below;
    const gap =
      above === null
        ? below
          ? myTeamRow.team.points - below.team.points
          : 0
        : above.team.points - myTeamRow.team.points;

    // ── timeline events for chart (approved activities only) ─────────────
    const timeline = await Promise.all(
      teamsEnriched.map(async (row) => {
        const approved = await ctx.db
          .query("activities")
          .withIndex("by_team_and_state", (q) =>
            q.eq("teamId", row.team._id).eq("state", "approved"),
          )
          .collect();
        return {
          teamId: row.team._id,
          events: approved
            .map((a) => ({
              timestamp: new Date(a.date).getTime(),
              points: a.pointsEarned ?? 0,
            }))
            .sort((a, b) => a.timestamp - b.timestamp),
        };
      }),
    );

    // ── team's activities today (pending + approved only) ───────────────
    const teamActivitiesToday = await ctx.db
      .query("activities")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", myTeamRow.team._id).eq("date", todayStr),
      )
      .collect();
    const todayActivityCount = teamActivitiesToday.filter(
      (a) => a.state === "pending" || a.state === "approved",
    ).length;

    // ── timeline framing ─────────────────────────────────────────────────
    const startMs = new Date(selectedTournament.startDate).getTime();
    const endMs = new Date(selectedTournament.endDate).getTime();
    const totalDays = Math.max(Math.round((endMs - startMs) / DAY_MS), 1);
    const dayNumber = Math.min(
      Math.max(Math.round((Date.now() - startMs) / DAY_MS) + 1, 1),
      totalDays,
    );
    const daysRemaining = Math.max(Math.ceil((endMs - Date.now()) / DAY_MS), 0);

    const recentActivity = await loadRecentActivity(
      ctx,
      selectedTournament._id,
      myTeamRow.team._id,
    );

    return {
      viewer: { firstName: firstName(user.name) },
      isOnAnyTeam: true,
      switchableTournaments: switchableUnique.map((s) => ({
        _id: s.tournament._id,
        name: s.tournament.name,
        lifecycleState: s.state,
      })),
      selected: {
        tournament: selectedTournament,
        lifecycleState: lifecycle,
        dayNumber,
        totalDays,
        daysRemaining,
        teams: teamsEnriched,
        timeline,
        myTeam: {
          ...myTeamRow,
          rank: myRank,
          gap: Math.abs(gap),
          comparison,
          comparedToName: comparedTo?.team.name ?? null,
        },
        todayActivityCount,
        recentActivity,
      },
      inbox: await loadInbox(ctx, user._id, teamMemberships),
    } as const;
  },
});

// ── recent activity loader ─────────────────────────────────────────────

const RECENT_ACTIVITY_LIMIT = 15;

async function loadRecentActivity(
  ctx: QueryCtx,
  tournamentId: Id<"tournaments">,
  viewerTeamId: Id<"teams">,
) {
  const approved = await ctx.db
    .query("activities")
    .withIndex("by_tournament_and_state", (q) =>
      q.eq("tournamentId", tournamentId).eq("state", "approved"),
    )
    .collect();

  const ranked = approved
    .map((a) => ({ activity: a, timestamp: a.reviewedAt ?? a._creationTime }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, RECENT_ACTIVITY_LIMIT);

  const teamIds = [...new Set(ranked.map(({ activity }) => activity.teamId))];
  const userIds = [
    ...new Set(ranked.map(({ activity }) => activity.createdBy)),
  ];

  const [teamDocs, userDocs] = await Promise.all([
    Promise.all(teamIds.map((id) => ctx.db.get(id))),
    Promise.all(userIds.map((id) => ctx.db.get(id))),
  ]);

  const teamMap = new Map(teamIds.map((id, i) => [id, teamDocs[i]]));
  const userMap = new Map(userIds.map((id, i) => [id, userDocs[i]]));

  return ranked.map(({ activity, timestamp }) => {
    const team = teamMap.get(activity.teamId);
    const actor = userMap.get(activity.createdBy);
    return {
      id: activity._id,
      team: {
        _id: activity.teamId,
        name: team?.name ?? "Unknown team",
      },
      isViewerTeam: activity.teamId === viewerTeamId,
      actorName: actor?.name ?? null,
      description: activity.description ?? null,
      tier: activity.tier,
      type: activity.type,
      pointsEarned: Math.round(activity.pointsEarned ?? 0),
      timestamp,
    };
  });
}

// ── inbox loader ───────────────────────────────────────────────────────

async function loadInbox(
  ctx: QueryCtx,
  userId: Id<"users">,
  teamMemberships: Doc<"teamMembers">[],
) {
  const userPending = await ctx.db
    .query("joinRequests")
    .withIndex("by_user_and_status", (q) =>
      q.eq("userId", userId).eq("status", "pending"),
    )
    .collect();

  const invitations = await Promise.all(
    userPending
      .filter((r) => r.initiator === "team")
      .map(async (r) => {
        const team = await ctx.db.get(r.teamId);
        const tournament = team ? await ctx.db.get(team.tournamentId) : null;
        const inviter = await ctx.db.get(r.createdBy);
        return {
          kind: "invitation" as const,
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
  const captainRequests = (
    await Promise.all(
      captainMemberships.map(async (m) => {
        const team = await ctx.db.get(m.teamId);
        if (!team) return [];
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
            return {
              kind: "joinRequest" as const,
              id: r._id,
              userName: requester?.name ?? "A user",
              teamName: team.name,
              timestamp: new Date(r.createdAt).getTime(),
            };
          }),
        );
      }),
    )
  ).flat();

  return [...invitations, ...captainRequests].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
}

function firstName(name: string | undefined): string {
  if (!name) return "Player";
  return name.trim().split(/\s+/)[0] ?? name;
}
