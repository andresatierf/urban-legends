import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { computeChallengeAward } from "../lifecycle/challengeAwards";
import { getCurrentUserOrThrow } from "../users";

// One discriminated feed for the My Activities page: the viewer's Activities
// (via their Participations) plus every Challenge they're rostered in, sorted
// by a comparable timestamp so both kinds interleave deterministically.
// Award amounts on Challenges are computed on read using the shared helper —
// no per-team award is stored (self-healing per #313).
export type MyFeedItem =
  | {
      kind: "activity";
      sortDate: string;
      activity: Doc<"activities">;
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

    // Activities — via the viewer's Participation rows (matches listMine).
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

    const activityItems: MyFeedItem[] = activities.map((activity) => ({
      kind: "activity",
      sortDate: activity.date,
      activity,
    }));

    // Challenges — only those the viewer is rostered in.
    const rosterEntries = await ctx.db
      .query("challengeRosterEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const challengeItems: MyFeedItem[] = [];
    for (const entry of rosterEntries) {
      const challenge = await ctx.db.get(entry.challengeId);
      if (!challenge) continue;

      // Find the viewer's team in this Challenge's tournament. A user only
      // belongs to at most one team per tournament (see teams rules), so
      // pick the first match.
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      const teams = await Promise.all(
        memberships.map((m) => ctx.db.get(m.teamId)),
      );
      const team = teams.find(
        (t) => t?.tournamentId === challenge.tournamentId,
      );
      if (!team) continue;

      const award =
        challenge.state === "approved"
          ? await computeChallengeAward(ctx, challenge, team)
          : null;

      challengeItems.push({
        kind: "challenge",
        sortDate:
          challenge.state === "approved"
            ? challenge.updatedAt
            : challenge.createdAt,
        challenge,
        team: { _id: team._id, name: team.name },
        award: award
          ? { amount: award.amount, isTeamAward: award.isTeamAward }
          : null,
      });
    }

    return [...activityItems, ...challengeItems].sort((a, b) =>
      b.sortDate.localeCompare(a.sortDate),
    );
  },
});
