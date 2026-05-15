import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { IllegalAccess, hasSomeReviewAccess } from "../authority/core";
import { batchGetDocuments, toIdMap } from "../lib/helpers";
import { getCurrentUserOrThrow } from "../users";

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeReviewAccess(ctx, user._id))) {
      return 0;
    }

    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});

const stateValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

export const listForReview = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tournamentId: v.optional(v.id("tournaments")),
    teamId: v.optional(v.id("teams")),
    userId: v.optional(v.id("users")),
    state: v.optional(v.array(stateValidator)),
    search: v.optional(v.string()),
    orderBy: v.optional(
      v.union(
        v.literal("date-desc"),
        v.literal("date-asc"),
        v.literal("points-desc"),
        v.literal("points-asc"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!(await hasSomeReviewAccess(ctx, user._id)))
      throw new IllegalAccess("reviewer");

    const states = args.state ?? ["pending"];
    const order =
      args.orderBy === "date-asc" || args.orderBy === "points-asc"
        ? ("asc" as const)
        : ("desc" as const);

    const paginated = await paginateSubmissions(ctx, args, states, order);

    const individualSubs = paginated.page.filter(
      (s) => s.submissionType === "individual",
    );
    const teamSubs = paginated.page.filter((s) => s.submissionType === "team");

    const seenGroupIds = new Set<string>();
    const uniqueGroupSubs = teamSubs.filter((s) => {
      if (!s.submissionGroupId) return false;
      const gid = s.submissionGroupId as string;
      if (seenGroupIds.has(gid)) return false;
      seenGroupIds.add(gid);
      return true;
    });

    const groupIds = uniqueGroupSubs
      .map((s) => s.submissionGroupId)
      .filter((id): id is Id<"submissionGroups"> => id != null);
    const groupDocs = await batchGetDocuments(
      ctx,
      "submissionGroups",
      groupIds,
    );
    const groupMap = toIdMap(groupDocs);

    const groupMemberSubs = new Map<string, typeof teamSubs>();
    for (const gid of groupIds) {
      const members = await ctx.db
        .query("submissions")
        .withIndex("by_group", (q) => q.eq("submissionGroupId", gid))
        .collect();
      groupMemberSubs.set(gid as string, members);
    }

    const allTeamIds = new Set<Id<"teams">>();
    const allTournamentIds = new Set<Id<"tournaments">>();
    const allUserIds = new Set<Id<"users">>();

    for (const s of individualSubs) {
      allTeamIds.add(s.teamId);
      allTournamentIds.add(s.tournamentId);
      allUserIds.add(s.userId);
    }
    for (const s of uniqueGroupSubs) {
      allTeamIds.add(s.teamId);
      allTournamentIds.add(s.tournamentId);
    }
    for (const [, members] of groupMemberSubs) {
      for (const m of members) allUserIds.add(m.userId);
    }

    const [teams, tournaments, users] = await Promise.all([
      batchGetDocuments(ctx, "teams", [...allTeamIds]),
      batchGetDocuments(ctx, "tournaments", [...allTournamentIds]),
      batchGetDocuments(ctx, "users", [...allUserIds]),
    ]);

    const teamMap = toIdMap(teams);
    const tournamentMap = toIdMap(tournaments);
    const userMap = toIdMap(users);

    const enrichedIndividual = (
      await Promise.all(
        individualSubs.map(async (submission) => {
          const team = teamMap.get(submission.teamId);
          const tournament = tournamentMap.get(submission.tournamentId);
          const submitter = userMap.get(submission.userId);
          if (!team || !tournament || !submitter) return null;

          const evidence = await resolveEvidence(
            ctx,
            submission.evidenceStorageIds,
          );

          return {
            type: "individual" as const,
            id: submission._id,
            submission,
            team,
            tournament,
            submitter,
            evidence,
            date: submission.date,
            createdAt: submission.date,
          };
        }),
      )
    ).filter((i): i is NonNullable<typeof i> => i != null);

    const enrichedGroups = (
      await Promise.all(
        uniqueGroupSubs.map(async (sub) => {
          const group = sub.submissionGroupId
            ? groupMap.get(sub.submissionGroupId)
            : null;
          if (!group) return null;

          const team = teamMap.get(group.teamId);
          const tournament = tournamentMap.get(group.tournamentId);
          if (!team || !tournament) return null;

          const memberSubs = groupMemberSubs.get(group._id as string) ?? [];
          const submitters = memberSubs
            .map((s) => userMap.get(s.userId))
            .filter((u): u is NonNullable<typeof u> => u != null);

          const submitterEvidence = await Promise.all(
            memberSubs.map(async (ms) => {
              const submitter = userMap.get(ms.userId);
              const evidence = await resolveEvidence(
                ctx,
                ms.evidenceStorageIds,
              );
              return {
                userId: ms.userId as string,
                submitterName: submitter?.name ?? "Unknown",
                submitterImageUrl: submitter?.imageUrl,
                evidence,
              };
            }),
          );

          return {
            type: "group" as const,
            id: group._id,
            group,
            team,
            tournament,
            submissions: memberSubs,
            submitters,
            submitterEvidence,
            date: group.date,
            createdAt: group.createdAt,
          };
        }),
      )
    ).filter((i): i is NonNullable<typeof i> => i != null);

    let items = [...enrichedIndividual, ...enrichedGroups];

    if (args.search) {
      const q = args.search.toLowerCase();
      items = items.filter((item) => {
        if (item.type === "individual") {
          return (
            item.team.name.toLowerCase().includes(q) ||
            item.tournament.name.toLowerCase().includes(q) ||
            item.submitter.name.toLowerCase().includes(q) ||
            (item.submission.description?.toLowerCase().includes(q) ?? false)
          );
        }
        return (
          item.team.name.toLowerCase().includes(q) ||
          item.tournament.name.toLowerCase().includes(q) ||
          item.submitters.some((s) => s.name.toLowerCase().includes(q))
        );
      });
    }

    if (args.orderBy === "points-desc" || args.orderBy === "points-asc") {
      const dir = args.orderBy === "points-desc" ? -1 : 1;
      items.sort((a, b) => {
        const pa =
          a.type === "individual"
            ? a.submission.pointsEarned
            : a.group.pointsEarned;
        const pb =
          b.type === "individual"
            ? b.submission.pointsEarned
            : b.group.pointsEarned;
        return (pa - pb) * dir;
      });
    }

    return {
      page: items,
      isDone: paginated.isDone,
      continueCursor: paginated.continueCursor,
    };
  },
});

function paginateSubmissions(
  ctx: QueryCtx,
  args: {
    paginationOpts: {
      numItems: number;
      cursor: string | null;
      endCursor?: string | null;
      id?: number;
      maximumRowsRead?: number;
      maximumBytesRead?: number;
    };
    tournamentId?: Id<"tournaments">;
    teamId?: Id<"teams">;
    userId?: Id<"users">;
  },
  states: Array<"pending" | "approved" | "rejected">,
  order: "asc" | "desc",
) {
  const opts = args.paginationOpts;

  if (states.length === 1) {
    const state = states[0];

    if (args.teamId) {
      return ctx.db
        .query("submissions")
        .withIndex("by_team_state_and_date", (q) =>
          q.eq("teamId", args.teamId!).eq("state", state),
        )
        .order(order)
        .paginate(opts);
    }

    if (args.tournamentId) {
      return ctx.db
        .query("submissions")
        .withIndex("by_tournament_state_and_date", (q) =>
          q.eq("tournamentId", args.tournamentId!).eq("state", state),
        )
        .order(order)
        .paginate(opts);
    }

    if (args.userId) {
      return ctx.db
        .query("submissions")
        .withIndex("by_user_state_and_date", (q) =>
          q.eq("userId", args.userId!).eq("state", state),
        )
        .order(order)
        .paginate(opts);
    }

    return ctx.db
      .query("submissions")
      .withIndex("by_state_and_date", (q) => q.eq("state", state))
      .order(order)
      .paginate(opts);
  }

  return ctx.db
    .query("submissions")
    .order(order)
    .filter((q) =>
      q.and(
        q.or(...states.map((s) => q.eq(q.field("state"), s))),
        ...(args.tournamentId
          ? [q.eq(q.field("tournamentId"), args.tournamentId)]
          : []),
        ...(args.teamId ? [q.eq(q.field("teamId"), args.teamId)] : []),
        ...(args.userId ? [q.eq(q.field("userId"), args.userId)] : []),
      ),
    )
    .paginate(opts);
}

async function resolveEvidence(ctx: QueryCtx, storageIds?: Id<"_storage">[]) {
  if (!storageIds || storageIds.length === 0) return [];
  const resolved = await Promise.all(
    storageIds.map(async (storageId, idx) => {
      const url = await ctx.storage.getUrl(storageId);
      if (!url) return null;
      return {
        _id: storageId as string,
        url,
        filename: `evidence-${idx + 1}.jpg`,
      };
    }),
  );
  return resolved.filter((e): e is NonNullable<typeof e> => e !== null);
}

export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeReviewAccess(ctx, user._id)))
      throw new IllegalAccess("reviewer");

    const reviewedSubmissions = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("managedBy"), user._id))
      .collect();

    const reviewedGroups = await ctx.db
      .query("submissionGroups")
      .filter((q) => q.eq(q.field("managedBy"), user._id))
      .collect();

    const totalReviews = reviewedSubmissions.length + reviewedGroups.length;
    const approvedSubmissions = reviewedSubmissions.filter(
      (s) => s.state === "approved",
    ).length;
    const approvedGroups = reviewedGroups.filter(
      (g) => g.state === "approved",
    ).length;
    const approved = approvedSubmissions + approvedGroups;

    const rejectedSubmissions = reviewedSubmissions.filter(
      (s) => s.state === "rejected",
    ).length;
    const rejectedGroups = reviewedGroups.filter(
      (g) => g.state === "rejected",
    ).length;
    const rejected = rejectedSubmissions + rejectedGroups;

    const approvalRate =
      totalReviews > 0 ? Math.round((approved / totalReviews) * 100) : 0;

    const recentReviews = [...reviewedSubmissions, ...reviewedGroups]
      .sort((a, b) => {
        const aDate = "updatedAt" in a ? a.updatedAt : a.date;
        const bDate = "updatedAt" in b ? b.updatedAt : b.date;
        return bDate.localeCompare(aDate);
      })
      .slice(0, 20);

    const enrichedRecent = await Promise.all(
      recentReviews.map(async (item) => {
        if ("submissionType" in item) {
          const [team, tournament] = await Promise.all([
            ctx.db.get(item.teamId),
            ctx.db.get(item.tournamentId),
          ]);

          return {
            type: "individual" as const,
            id: item._id,
            state: item.state,
            date: item.date,
            team,
            tournament,
          };
        }

        const [team, tournament] = await Promise.all([
          ctx.db.get(item.teamId),
          ctx.db.get(item.tournamentId),
        ]);

        return {
          type: "group" as const,
          id: item._id,
          state: item.state,
          date: item.date,
          updatedAt: item.updatedAt,
          team,
          tournament,
        };
      }),
    );

    return {
      totalReviews,
      approved,
      rejected,
      approvalRate,
      recentReviews: enrichedRecent,
    };
  },
});
