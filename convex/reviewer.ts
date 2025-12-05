import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { getCurrentUserOrThrow, type UserWithRoles } from "./users";

function validateHasReviewerAccess(user: UserWithRoles) {
  if (
    !["admin", "tournament_manager", "reviewer"].some((role) =>
      user.roleNames.includes(role),
    )
  ) {
    throw new Error("Reviewer or admin access required");
  }
}

/**
 * Get the count of pending submissions (both individual and groups) for reviewers.
 * Only accessible to users with reviewer or admin roles.
 */
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateHasReviewerAccess(user);

    // Count all pending individual submissions
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count all pending submission groups (team activities)
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
    validateHasReviewerAccess(user);

    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    // Get pending individual submissions
    let individualQuery = ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"));

    // Get pending submission groups
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

    const teamMap = teams.reduce<Map<Id<"teams">, Doc<"teams">>>(
      (map, team) => map.set(team._id, team),
      new Map(),
    );

    const tournamentMap = tournaments.reduce<
      Map<Id<"tournaments">, Doc<"tournaments">>
    >((map, tournament) => map.set(tournament._id, tournament), new Map());

    const userMap = users.reduce<Map<Id<"users">, Doc<"users">>>(
      (map, user) => map.set(user._id, user),
      new Map(),
    );

    // Enrich individual submissions with context
    const enrichedIndividual = individualSubmissions
      .map((submission) => {
        const team = teamMap.get(submission.teamId);
        const tournament = tournamentMap.get(submission.tournamentId);
        const submitter = userMap.get(submission.userId);

        // Skip submissions with missing data (data integrity issue)
        if (!team || !tournament || !submitter) {
          return null;
        }

        return {
          type: "individual" as const,
          id: submission._id,
          submission,
          team,
          tournament,
          submitter,
          date: submission.date,
          createdAt: submission.date, // Use date for sorting
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Enrich submission groups with context
    const enrichedGroups = (
      await Promise.all(
        submissionGroups.map(async (group) => {
          const team = teamMap.get(group.teamId);
          const tournament = tournamentMap.get(group.tournamentId);

          // Skip groups with missing data (data integrity issue)
          if (!team || !tournament) {
            return null;
          }

          // Get all submissions in this group
          const groupSubmissions = await ctx.db
            .query("submissions")
            .withIndex("by_group", (q) => q.eq("submissionGroupId", group._id))
            .collect();

          // Get submitters
          const submitters = await Promise.all(
            groupSubmissions.map((s) => ctx.db.get(s.userId)),
          );

          return {
            type: "group" as const,
            id: group._id,
            group,
            team,
            tournament,
            submissions: groupSubmissions,
            submitters: submitters.filter((s) => s !== null),
            date: group.date,
            createdAt: group.createdAt,
          };
        }),
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    // Combine and sort by date (most recent first)
    const combined = [...enrichedIndividual, ...enrichedGroups].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    // Apply pagination
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
    validateHasReviewerAccess(user);

    // Get all submissions managed by this reviewer
    const reviewedSubmissions = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("managedBy"), user._id))
      .collect();

    // Get all submission groups managed by this reviewer
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

    // Get recent reviews (last 20)
    const recentReviews = [...reviewedSubmissions, ...reviewedGroups]
      .sort((a, b) => {
        const aDate = "updatedAt" in a ? a.updatedAt : a.date;
        const bDate = "updatedAt" in b ? b.updatedAt : b.date;
        return bDate.localeCompare(aDate);
      })
      .slice(0, 20);

    // Enrich recent reviews with context
    const enrichedRecent = await Promise.all(
      recentReviews.map(async (item) => {
        if ("submissionType" in item) {
          // It's a submission
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
        // It's a submission group
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
