import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { computeChallengeAward } from "../lifecycle/challengeAwards";
import { getCurrentUserOrThrow } from "../users";

// Award amounts on Challenges are computed on read — no per-team award is stored.
export type FeedParticipant = {
  userId: Id<"users">;
  name: string;
  imageUrl?: string;
  hasEvidence: boolean;
  fulfilled: boolean;
  isCreator: boolean;
};

export type MyFeedItem =
  | {
      kind: "activity";
      sortDate: string;
      activity: Doc<"activities">;
      participants: FeedParticipant[];
    }
  | {
      kind: "challenge";
      sortDate: string;
      challenge: Doc<"challenges">;
      team: {
        _id: Id<"teams">;
        name: string;
      };
      award: {
        amount: number;
        isTeamAward: boolean;
      } | null;
    };

export const myFeed = query({
  args: {},
  handler: async (ctx): Promise<MyFeedItem[]> => {
    const user = await getCurrentUserOrThrow(ctx);

    const parts = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const activityIds = Array.from(new Set(parts.map((p) => p.activityId)));
    const activities = (
      await Promise.all(activityIds.map((id) => ctx.db.get(id)))
    ).filter(
      (a): a is NonNullable<typeof a> => a !== null && a.state !== "deleted",
    );

    const activityItems: MyFeedItem[] = await Promise.all(
      activities.map(async (activity) => {
        const parts = await ctx.db
          .query("participations")
          .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
          .collect();
        const participants: FeedParticipant[] = await Promise.all(
          parts.map(async (p) => {
            const u = await ctx.db.get(p.userId);
            return {
              userId: p.userId,
              name: u?.name ?? u?.email ?? "Unknown",
              imageUrl: u?.imageUrl,
              hasEvidence: (p.evidenceStorageIds ?? []).length > 0,
              fulfilled: !!p.fulfilledAt,
              isCreator: p.userId === activity.createdBy,
            };
          }),
        );
        // Creator first, then fulfilled, then the rest — stable, readable order.
        participants.sort(
          (a, b) =>
            Number(b.isCreator) - Number(a.isCreator) ||
            Number(b.fulfilled) - Number(a.fulfilled) ||
            a.name.localeCompare(b.name),
        );
        return {
          kind: "activity" as const,
          sortDate: activity.date,
          activity,
          participants,
        };
      }),
    );

    const rosterEntries = await ctx.db
      .query("challengeRosterEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch the viewer's team memberships once — reused for every roster entry.
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const userTeams = (
      await Promise.all(memberships.map((m) => ctx.db.get(m.teamId)))
    ).filter((t): t is NonNullable<typeof t> => t !== null);

    const challengeItems: MyFeedItem[] = [];
    for (const entry of rosterEntries) {
      const challenge = await ctx.db.get(entry.challengeId);
      if (!challenge) continue;

      // A user belongs to at most one team per tournament (see teams rules).
      const team = userTeams.find(
        (t) => t.tournamentId === challenge.tournamentId,
      );
      if (!team) continue;

      const isApproved = challenge.state === "approved";
      let award: { amount: number; isTeamAward: boolean } | null = null;
      if (isApproved) {
        const { amount, isTeamAward } = await computeChallengeAward(
          ctx,
          challenge,
          team,
        );
        award = { amount, isTeamAward };
      }

      challengeItems.push({
        kind: "challenge",
        sortDate: isApproved ? challenge.updatedAt : challenge.createdAt,
        challenge,
        team: { _id: team._id, name: team.name },
        award,
      });
    }

    return [...activityItems, ...challengeItems].sort((a, b) =>
      b.sortDate.localeCompare(a.sortDate),
    );
  },
});
