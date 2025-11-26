import { internalMutation } from "./_generated/server";
import { nowUTC, toUTCDateString, toUTCEndOfDayString } from "./lib/dates";

/**
 * Migrates all date fields to UTC ISO format.
 * This migration is idempotent - can be run multiple times safely.
 */
export const migrateDatesToUTC = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting date migration to UTC ISO format...");

    const stats = {
      tournaments: { updated: 0, skipped: 0, errors: 0 },
      submissions: { updated: 0, skipped: 0, errors: 0 },
      submissionGroups: { updated: 0, skipped: 0, errors: 0 },
      teamInvitations: { updated: 0, skipped: 0, errors: 0 },
      joinRequests: { updated: 0, skipped: 0, errors: 0 },
      teams: { updated: 0, skipped: 0, errors: 0 },
      userRoles: { updated: 0, skipped: 0, errors: 0 },
    };

    // Migrate tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const tournament of tournaments) {
      try {
        // Check if already migrated (has 'T' in date string)
        const needsMigration =
          !tournament.startDate.includes("T") ||
          !tournament.endDate.includes("T");

        if (!needsMigration) {
          stats.tournaments.skipped++;
          continue;
        }

        await ctx.db.patch(tournament._id, {
          startDate: toUTCDateString(tournament.startDate),
          endDate: toUTCEndOfDayString(tournament.endDate),
          ...(tournament.completedAt && !tournament.completedAt.includes("T")
            ? { completedAt: toUTCDateString(tournament.completedAt) }
            : {}),
        });
        stats.tournaments.updated++;
      } catch (error) {
        console.error(`Error migrating tournament ${tournament._id}:`, error);
        stats.tournaments.errors++;
      }
    }

    // Migrate submissions
    const submissions = await ctx.db.query("submissions").collect();
    for (const submission of submissions) {
      try {
        if (submission.date.includes("T")) {
          stats.submissions.skipped++;
          continue;
        }

        await ctx.db.patch(submission._id, {
          date: toUTCDateString(submission.date),
        });
        stats.submissions.updated++;
      } catch (error) {
        console.error(`Error migrating submission ${submission._id}:`, error);
        stats.submissions.errors++;
      }
    }

    // Migrate submissionGroups
    const groups = await ctx.db.query("submissionGroups").collect();
    for (const group of groups) {
      try {
        const needsMigration =
          !group.date.includes("T") ||
          !group.createdAt.includes("T") ||
          !group.updatedAt.includes("T");

        if (!needsMigration) {
          stats.submissionGroups.skipped++;
          continue;
        }

        await ctx.db.patch(group._id, {
          date: toUTCDateString(group.date),
          createdAt: group.createdAt.includes("T")
            ? group.createdAt
            : toUTCDateString(group.createdAt),
          updatedAt: group.updatedAt.includes("T") ? group.updatedAt : nowUTC(),
        });
        stats.submissionGroups.updated++;
      } catch (error) {
        console.error(`Error migrating submissionGroup ${group._id}:`, error);
        stats.submissionGroups.errors++;
      }
    }

    // Migrate teamInvitations (likely already UTC, but verify)
    const invitations = await ctx.db.query("teamInvitations").collect();
    for (const invitation of invitations) {
      try {
        const needsMigration =
          !invitation.expiresAt.includes("T") ||
          !invitation.createdAt.includes("T") ||
          (invitation.respondedAt && !invitation.respondedAt.includes("T"));

        if (!needsMigration) {
          stats.teamInvitations.skipped++;
          continue;
        }

        await ctx.db.patch(invitation._id, {
          expiresAt: invitation.expiresAt.includes("T")
            ? invitation.expiresAt
            : toUTCDateString(invitation.expiresAt),
          createdAt: invitation.createdAt.includes("T")
            ? invitation.createdAt
            : toUTCDateString(invitation.createdAt),
          ...(invitation.respondedAt && !invitation.respondedAt.includes("T")
            ? { respondedAt: toUTCDateString(invitation.respondedAt) }
            : {}),
        });
        stats.teamInvitations.updated++;
      } catch (error) {
        console.error(`Error migrating invitation ${invitation._id}:`, error);
        stats.teamInvitations.errors++;
      }
    }

    // Migrate joinRequests
    const requests = await ctx.db.query("joinRequests").collect();
    for (const request of requests) {
      try {
        const needsMigration =
          !request.createdAt.includes("T") ||
          (request.respondedAt && !request.respondedAt.includes("T"));

        if (!needsMigration) {
          stats.joinRequests.skipped++;
          continue;
        }

        await ctx.db.patch(request._id, {
          createdAt: request.createdAt.includes("T")
            ? request.createdAt
            : toUTCDateString(request.createdAt),
          ...(request.respondedAt && !request.respondedAt.includes("T")
            ? { respondedAt: toUTCDateString(request.respondedAt) }
            : {}),
        });
        stats.joinRequests.updated++;
      } catch (error) {
        console.error(`Error migrating joinRequest ${request._id}:`, error);
        stats.joinRequests.errors++;
      }
    }

    // Migrate teams (lastActivityAt)
    const teams = await ctx.db.query("teams").collect();
    for (const team of teams) {
      try {
        if (!team.lastActivityAt || team.lastActivityAt.includes("T")) {
          stats.teams.skipped++;
          continue;
        }

        await ctx.db.patch(team._id, {
          lastActivityAt: toUTCDateString(team.lastActivityAt),
        });
        stats.teams.updated++;
      } catch (error) {
        console.error(`Error migrating team ${team._id}:`, error);
        stats.teams.errors++;
      }
    }

    // Migrate userRoles (assignedAt)
    const userRoles = await ctx.db.query("userRoles").collect();
    for (const userRole of userRoles) {
      try {
        if (!userRole.assignedAt || userRole.assignedAt.includes("T")) {
          stats.userRoles.skipped++;
          continue;
        }

        await ctx.db.patch(userRole._id, {
          assignedAt: toUTCDateString(userRole.assignedAt),
        });
        stats.userRoles.updated++;
      } catch (error) {
        console.error(`Error migrating userRole ${userRole._id}:`, error);
        stats.userRoles.errors++;
      }
    }

    console.log("Migration complete:", stats);
    return stats;
  },
});

/**
 * Validates that all dates are in UTC ISO format.
 * Run this after migration to verify success.
 */
export const validateDateMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const issues: string[] = [];

    // Check tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const t of tournaments) {
      if (!t.startDate.includes("T")) {
        issues.push(`Tournament ${t._id}: startDate not migrated`);
      }
      if (!t.endDate.includes("T")) {
        issues.push(`Tournament ${t._id}: endDate not migrated`);
      }
    }

    // Check submissions
    const submissions = await ctx.db.query("submissions").collect();
    for (const s of submissions) {
      if (!s.date.includes("T")) {
        issues.push(`Submission ${s._id}: date not migrated`);
      }
    }

    // Check submissionGroups
    const groups = await ctx.db.query("submissionGroups").collect();
    for (const g of groups) {
      if (!g.date.includes("T")) {
        issues.push(`SubmissionGroup ${g._id}: date not migrated`);
      }
      if (!g.createdAt.includes("T")) {
        issues.push(`SubmissionGroup ${g._id}: createdAt not migrated`);
      }
      if (!g.updatedAt.includes("T")) {
        issues.push(`SubmissionGroup ${g._id}: updatedAt not migrated`);
      }
    }

    if (issues.length === 0) {
      console.log(" All dates successfully migrated to UTC ISO format");
      return { success: true, issues: [] };
    }
    console.error(" Migration validation found issues:", issues);
    return { success: false, issues };
  },
});
