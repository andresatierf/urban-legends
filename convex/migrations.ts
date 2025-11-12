import { internalMutation } from "./_generated/server";

/**
 * Migration to:
 * 1. Add points field to existing teams
 * 2. Add default scoring config to existing tournaments
 * 3. Add tier and pointsEarned to existing submissions (defaults to base tier, 1 point)
 *
 * Run this once after deploying the schema changes:
 * bunx convex run migrations:migrateFlexibleScoring
 */
export const migrateFlexibleScoring = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration: migrateFlexibleScoring");

    // Part 1: Migrate tournaments to have default scoring config
    const tournaments = await ctx.db.query("tournaments").collect();
    let tournamentsMigrated = 0;

    for (const tournament of tournaments) {
      if (!tournament.scoringConfig) {
        await ctx.db.patch(tournament._id, {
          scoringConfig: {
            individualPoints: { base: 1, advanced: 1 },
            teamExercisePoints: { base: 1, advanced: 1 },
            teamExerciseThreshold: 0.5,
          },
        });
        tournamentsMigrated++;
      }
    }

    console.log(`Migrated ${tournamentsMigrated} tournaments`);

    // Part 2: Migrate submissions to have tier and pointsEarned
    const submissions = await ctx.db.query("submissions").collect();
    let submissionsMigrated = 0;

    for (const submission of submissions) {
      if (
        submission.tier === undefined ||
        submission.pointsEarned === undefined
      ) {
        const updates: Record<string, string | number> = {};

        if (submission.tier === undefined) {
          updates.tier = "base";
        }

        // If approved and doesn't have pointsEarned, set to 1 (legacy default)
        if (
          submission.pointsEarned === undefined &&
          submission.state === "approved"
        ) {
          updates.pointsEarned = 1;
        }

        if (Object.keys(updates).length > 0) {
          await ctx.db.patch(submission._id, updates);
          submissionsMigrated++;
        }
      }
    }

    console.log(`Migrated ${submissionsMigrated} submissions`);

    // Part 3: Migrate teams to have points
    const teams = await ctx.db.query("teams").collect();
    let teamsMigrated = 0;
    let teamsSkipped = 0;

    for (const team of teams) {
      // Check if team already has points field
      if (team.points !== undefined) {
        teamsSkipped++;
        continue;
      }

      // Get all approved submissions for this team
      const approvedSubmissions = await ctx.db
        .query("submissions")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .filter((q) => q.eq(q.field("state"), "approved"))
        .collect();

      // Sum up points earned (fallback to 1 for legacy)
      const totalPoints = approvedSubmissions.reduce(
        (sum, sub) => sum + (sub.pointsEarned || 1),
        0,
      );

      // Find most recent submission for lastActivityAt
      const sortedSubmissions = approvedSubmissions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const lastActivityAt = sortedSubmissions[0]?.date;

      // Update team with points
      await ctx.db.patch(team._id, {
        points: totalPoints,
        lastActivityAt,
      });

      teamsMigrated++;
      console.log(`Migrated team ${team._id}: ${totalPoints} points`);
    }

    console.log(`Teams: ${teamsMigrated} migrated, ${teamsSkipped} skipped`);

    return {
      success: true,
      tournamentsMigrated,
      submissionsMigrated,
      teamsMigrated,
      teamsSkipped,
    };
  },
});
