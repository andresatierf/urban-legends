import { internalMutation } from "./_generated/server";

/**
 * Migration to add submissionType to existing submissions and create submission groups.
 *
 * This migration:
 * 1. Sets submissionType for all existing submissions based on teammates array
 * 2. Creates submission groups for team activities
 * 3. Links submissions to their groups
 */
export const migrateSubmissionsToGroups = internalMutation({
  args: {},
  handler: async (ctx) => {
    const submissions = await ctx.db.query("submissions").collect();

    // Step 1: Set submissionType for all existing submissions
    for (const submission of submissions) {
      // If teammates array exists and has items, it was intended as team activity
      // Otherwise, it's individual
      const submissionType =
        submission.teammates && submission.teammates.length > 0
          ? "team"
          : "individual";

      await ctx.db.patch(submission._id, { submissionType });
    }

    // Step 2: Group TEAM submissions by (teamId, date)
    const groupMap = new Map<string, typeof submissions>();

    for (const submission of submissions) {
      if (submission.state === "deleted") continue;
      if (submission.submissionType !== "team") continue; // Only group team activities

      const key = `${submission.teamId}:${submission.date}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)?.push(submission);
    }

    // Create groups
    let created = 0;
    for (const [_key, subs] of Array.from(groupMap.entries())) {
      const firstSub = subs[0];

      // Calculate participant count
      // OLD: participantCount = teammates.length + 1
      // NEW: participantCount = number of submissions in group
      const participantCount = subs.length;

      // Get team member count at time of submission
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", firstSub.teamId))
        .collect();

      const totalTeamMembers = teamMembers.length;
      const participationRate =
        totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;

      // Get tournament for threshold
      const tournament = await ctx.db.get(firstSub.tournamentId);
      if (!tournament) continue;

      const scoringConfig =
        "scoringConfig" in tournament
          ? tournament.scoringConfig
          : {
              individualPoints: { base: 1, advanced: 1 },
              teamExercisePoints: { base: 1, advanced: 1 },
              teamExerciseThreshold: 0.5,
            };

      const isTeamExercise =
        participationRate >= scoringConfig.teamExerciseThreshold;

      // Determine tier (use first submission's tier, or highest if want advanced logic)
      const tier = subs[0].tier || "base";

      // Determine state (all should be same, but take first)
      const state = subs[0].state;

      // Calculate points
      let pointsEarned = 0;
      if (state === "approved") {
        pointsEarned = isTeamExercise
          ? scoringConfig.teamExercisePoints[tier]
          : scoringConfig.individualPoints[tier];
      }

      const now = new Date().toISOString();

      // Create group
      const groupId = await ctx.db.insert("submissionGroups", {
        teamId: firstSub.teamId,
        tournamentId: firstSub.tournamentId,
        date: firstSub.date,
        state,
        tier,
        participantCount,
        totalTeamMembers,
        participationRate,
        isTeamExercise,
        pointsEarned,
        managedBy: firstSub.managedBy,
        createdAt: subs[0]._creationTime?.toString() || now,
        updatedAt: now,
      });

      // Link all submissions to group
      for (const sub of subs) {
        await ctx.db.patch(sub._id, {
          submissionGroupId: groupId,
          pointsEarned, // Normalize points across group
        });
      }

      created++;
    }

    return {
      submissionsProcessed: submissions.length,
      groupsCreated: created,
    };
  },
});
