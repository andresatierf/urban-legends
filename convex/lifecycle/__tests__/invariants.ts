import { expect } from "vitest";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

export async function assertSubmissionInvariant(
  ctx: MutationCtx,
  {
    teamId,
    tournamentId,
  }: { teamId: Id<"teams">; tournamentId: Id<"tournaments"> },
): Promise<void> {
  const team = await ctx.db.get(teamId);
  expect(team).not.toBeNull();

  // 1. team.points == Σ approved submission.pointsEarned
  const approvedSubmissions = await ctx.db
    .query("submissions")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .filter((q) => q.eq(q.field("state"), "approved"))
    .collect();

  const expectedPoints = approvedSubmissions.reduce(
    (sum, s) => sum + (s.pointsEarned ?? 0),
    0,
  );
  expect(team?.points).toBeCloseTo(expectedPoints, 5);

  // 2. No orphan groups — every submission group has at least one active submission
  const groups = await ctx.db
    .query("submissionGroups")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  for (const group of groups) {
    const activeSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", group._id))
      .filter((q) =>
        q.and(
          q.neq(q.field("state"), "deleted"),
          q.neq(q.field("state"), "rejected"),
        ),
      )
      .collect();
    expect(activeSubmissions.length).toBeGreaterThan(0);
  }

  // 3. Group state == join of children states
  for (const group of groups) {
    const activeSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", group._id))
      .filter((q) =>
        q.and(
          q.neq(q.field("state"), "deleted"),
          q.neq(q.field("state"), "rejected"),
        ),
      )
      .collect();

    if (activeSubmissions.length > 0) {
      const states = new Set(activeSubmissions.map((s) => s.state));
      const expectedGroupState =
        states.size === 1 ? Array.from(states)[0] : "pending";
      expect(group.state).toBe(expectedGroupState);
    }
  }

  // 4. sum(submission.pointsEarned) == group.pointsEarned for approved groups
  for (const group of groups.filter((g) => g.state === "approved")) {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", group._id))
      .collect();
    const sum = submissions.reduce((acc, s) => acc + (s.pointsEarned ?? 0), 0);
    expect(sum).toBeCloseTo(group.pointsEarned, 5);
  }

  // Satisfy the tournamentId parameter — used by callers to scope assertions
  void tournamentId;
}
