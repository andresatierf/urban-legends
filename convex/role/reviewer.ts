import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { IllegalAccess, hasSomeReviewAccess } from "../authority/core";
import { batchGetDocuments, toIdMap } from "../lib/helpers";
import { getCurrentUserOrThrow } from "../users";

/**
 * Get the count of pending submissions (both individual and groups) for reviewers.
 * Only accessible to users with reviewer or admin roles.
 */
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

/**
 * Get paginated pending submissions for review queue.
 * Returns both individual submissions and submission groups with full context.
 */
export const getPendingSubmissions = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    tournamentId: v.optional(v.id("tournaments")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!(await hasSomeReviewAccess(ctx, user._id)))
      throw new IllegalAccess("reviewer");

    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    let individualQuery = ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"));

    let groupQuery = ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"));

    if (args.tournamentId) {
      individualQuery = individualQuery.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
      groupQuery = groupQuery.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
    }

    if (args.teamId) {
      individualQuery = individualQuery.filter((q) =>
        q.eq(q.field("teamId"), args.teamId),
      );
      groupQuery = groupQuery.filter((q) =>
        q.eq(q.field("teamId"), args.teamId),
      );
    }

    const [individualSubmissions, submissionGroups] = await Promise.all([
      individualQuery.collect(),
      groupQuery.collect(),
    ]);

    const teamIds = Array.from(
      new Set([
        ...individualSubmissions.map((s) => s.teamId),
        ...submissionGroups.map((s) => s.teamId),
      ]),
    ) as Id<"teams">[];
    const tournamentIds = Array.from(
      new Set([
        ...individualSubmissions.map((s) => s.tournamentId),
        ...submissionGroups.map((s) => s.tournamentId),
      ]),
    ) as Id<"tournaments">[];

    const userIds = Array.from(
      new Set(individualSubmissions.map((s) => s.userId)),
    ) as Id<"users">[];

    const [teams, tournaments, users] = await Promise.all([
      ctx.db
        .query("teams")
        .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))))
        .collect(),
      ctx.db
        .query("tournaments")
        .filter((q) =>
          q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))),
        )
        .collect(),
      ctx.db
        .query("users")
        .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
        .collect(),
    ]);

    const teamMap = toIdMap(teams);
    const tournamentMap = toIdMap(tournaments);
    const userMap = toIdMap(users);

    const enrichedIndividual = (
      await Promise.all(
        individualSubmissions.map(async (submission) => {
          const team = teamMap.get(submission.teamId);
          const tournament = tournamentMap.get(submission.tournamentId);
          const submitter = userMap.get(submission.userId);

          if (!team || !tournament || !submitter) {
            return null;
          }

          const evidenceResolved = await Promise.all(
            (submission.evidenceStorageIds ?? []).map(
              async (storageId, idx) => {
                const url = await ctx.storage.getUrl(storageId);
                if (!url) return null;
                return {
                  _id: storageId as string,
                  url,
                  filename: `evidence-${idx + 1}.jpg`,
                };
              },
            ),
          );
          const evidence = evidenceResolved.filter(
            (e): e is NonNullable<typeof e> => e !== null,
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
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    const enrichedGroups = (
      await Promise.all(
        submissionGroups.map(async (group) => {
          const team = teamMap.get(group.teamId);
          const tournament = tournamentMap.get(group.tournamentId);

          if (!team || !tournament) {
            return null;
          }

          const groupSubmissions = await ctx.db
            .query("submissions")
            .withIndex("by_group", (q) => q.eq("submissionGroupId", group._id))
            .collect();

          const userIds = groupSubmissions.map((s) => s.userId);
          const submitters = await batchGetDocuments(ctx, "users", userIds);

          const submitterEvidence = await Promise.all(
            groupSubmissions.map(async (sub) => {
              const submitter = submitters.find((u) => u._id === sub.userId);
              const evidenceResolved = await Promise.all(
                (sub.evidenceStorageIds ?? []).map(async (storageId, idx) => {
                  const url = await ctx.storage.getUrl(storageId);
                  if (!url) return null;
                  return {
                    _id: storageId as string,
                    url,
                    filename: `evidence-${idx + 1}.jpg`,
                  };
                }),
              );
              return {
                userId: sub.userId as string,
                submitterName: submitter?.name ?? "Unknown",
                evidence: evidenceResolved.filter(
                  (e): e is NonNullable<typeof e> => e !== null,
                ),
              };
            }),
          );

          return {
            type: "group" as const,
            id: group._id,
            group,
            team,
            tournament,
            submissions: groupSubmissions,
            submitters,
            submitterEvidence,
            date: group.date,
            createdAt: group.createdAt,
          };
        }),
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    const combined = [...enrichedIndividual, ...enrichedGroups].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    const paginated = combined.slice(offset, offset + limit);

    return {
      items: paginated,
      total: combined.length,
      hasMore: offset + limit < combined.length,
    };
  },
});

/**
 * Get reviewer statistics for the current user.
 */
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
