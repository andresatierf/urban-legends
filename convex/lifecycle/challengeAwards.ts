import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type ChallengeAward = {
  amount: number;
  participantCount: number;
  teamSize: number;
  isTeamAward: boolean;
};

// Computes what a single Challenge awards to a specific Team, using the same
// rule as challenge approval: rate = rostered team members / team size, and
// rate ≥ threshold → team amount, otherwise individual amount. Returns
// amount = 0 when no rostered users are on the team or the team is empty.
export async function computeChallengeAward(
  ctx: QueryCtx | MutationCtx,
  challenge: Doc<"challenges">,
  team: Pick<Doc<"teams">, "_id">,
): Promise<ChallengeAward> {
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", team._id))
    .collect();
  const teamSize = members.length;
  if (teamSize === 0) {
    return { amount: 0, participantCount: 0, teamSize: 0, isTeamAward: false };
  }
  const memberUserIds = new Set(members.map((m) => m.userId));

  const roster = await ctx.db
    .query("challengeRosterEntries")
    .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
    .collect();
  const participantCount = roster.filter((r) =>
    memberUserIds.has(r.userId),
  ).length;

  if (participantCount === 0) {
    return {
      amount: 0,
      participantCount: 0,
      teamSize,
      isTeamAward: false,
    };
  }

  const rate = participantCount / teamSize;
  const isTeamAward = rate >= challenge.threshold;
  return {
    amount: isTeamAward ? challenge.teamAmount : challenge.individualAmount,
    participantCount,
    teamSize,
    isTeamAward,
  };
}

// Sums awards from all approved Challenges for a team, optionally excluding
// one Challenge (used by remove after soft-deletion to bypass snapshot
// isolation).
export async function sumChallengeAwardsForTeam(
  ctx: QueryCtx | MutationCtx,
  team: Pick<Doc<"teams">, "_id" | "tournamentId">,
  options: { excludeChallengeId?: Id<"challenges"> } = {},
): Promise<number> {
  const allApproved = await ctx.db
    .query("challenges")
    .withIndex("by_tournament_and_state", (q) =>
      q.eq("tournamentId", team.tournamentId).eq("state", "approved"),
    )
    .collect();
  const approved = options.excludeChallengeId
    ? allApproved.filter((c) => c._id !== options.excludeChallengeId)
    : allApproved;
  let total = 0;
  for (const challenge of approved) {
    const { amount } = await computeChallengeAward(ctx, challenge, team);
    total += amount;
  }
  return total;
}
