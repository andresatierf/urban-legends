import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  internalAction,
  internalMutation,
} from "./_generated/server";
import { rolesToCreate, teamsData } from "./data";
import { nowUTC } from "./lib/dates";

// ───────────────────────────────────────────────────────────────────────────
// Configuration
// ───────────────────────────────────────────────────────────────────────────

/**
 * Public-domain placeholder images attached to seeded submissions as evidence.
 * Picsum returns a fresh JPEG per seed string — these seeds are stable so
 * repeated runs land on the same pictures.
 */
const DEMO_EVIDENCE_URLS = [
  "https://picsum.photos/seed/run-1/800/600.jpg",
  "https://picsum.photos/seed/yoga-2/800/600.jpg",
  "https://picsum.photos/seed/cycling-3/800/600.jpg",
  "https://picsum.photos/seed/hike-4/800/600.jpg",
  "https://picsum.photos/seed/gym-5/800/600.jpg",
  "https://picsum.photos/seed/swim-6/800/600.jpg",
  "https://picsum.photos/seed/team-7/800/600.jpg",
  "https://picsum.photos/seed/sprint-8/800/600.jpg",
] as const;

/** Scoring config shared by every seeded tournament. */
const DEFAULT_SCORING = {
  individualPoints: { base: 2, advanced: 3 },
  teamExercisePoints: { base: 20, advanced: 30 },
  teamExerciseThreshold: 0.5,
};

/** Tournament names — both create keys and skip-if-exists anchors. */
const TOURNAMENT = {
  T2024: "Urban Legends Tournament 2024",
  T2026: "Urban Legends Tournament 2026",
  CAPTAINS: "Urban Legends Captains Cup 2026",
  UPCOMING: "Urban Legends Upcoming Cup 2026",
  ENDED: "Urban Legends Legacy Cup 2025",
  ACTIVE: "Urban Legends Live Cup 2026",
  MIXED: "Urban Legends Mixed Mayhem 2026",
} as const;

// ───────────────────────────────────────────────────────────────────────────
// Public entry points
// ───────────────────────────────────────────────────────────────────────────

interface SeedResult {
  roles: unknown;
  tournaments: Record<string, unknown>;
  joinRequests: unknown;
  notifications: unknown;
  evidence: {
    storageIdsCreated: number;
    evidenceAttached: number;
    eligible: number;
  };
}

/**
 * Single-shot demo seed. Populates the database with seven tournaments
 * across every lifecycle state, teams in every membership mode, submissions
 * in every state / tier / type, real submission groups, evidence images
 * attached to each eligible submission, join requests in every status, and
 * a notification inbox for the seed admin.
 *
 * Idempotent: re-running skips any section whose anchor tournament already
 * exists. Pair with `clearAllSeeded` to reset.
 */
export const seed = internalAction({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const db = await ctx.runMutation(internal.seed.seedDatabase, {});

    const storageIds: Id<"_storage">[] = [];
    for (const url of DEMO_EVIDENCE_URLS) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      storageIds.push(await ctx.storage.store(blob));
    }

    const evidence =
      storageIds.length > 0
        ? await ctx.runMutation(internal.seed.attachEvidence, { storageIds })
        : { evidenceAttached: 0, eligible: 0 };

    return {
      ...db,
      evidence: { storageIdsCreated: storageIds.length, ...evidence },
    };
  },
});

/** Every DB write the demo seed performs. */
export const seedDatabase = internalMutation({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    roles: unknown;
    tournaments: Record<string, unknown>;
    joinRequests: unknown;
    notifications: unknown;
  }> => {
    const roles = await upsertRoles(ctx);

    const tournaments: Record<string, unknown> = {
      tournament2024: await skipIfTournamentExists(ctx, TOURNAMENT.T2024, () =>
        seedTournament2024(ctx),
      ),
      tournament2026: await skipIfTournamentExists(ctx, TOURNAMENT.T2026, () =>
        seedTournament2026(ctx),
      ),
      captainsCup: await skipIfTournamentExists(ctx, TOURNAMENT.CAPTAINS, () =>
        seedCaptainsCup(ctx),
      ),
      upcoming: await skipIfTournamentExists(ctx, TOURNAMENT.UPCOMING, () =>
        seedUpcoming(ctx),
      ),
      ended: await skipIfTournamentExists(ctx, TOURNAMENT.ENDED, () =>
        seedEnded(ctx),
      ),
      active: await skipIfTournamentExists(ctx, TOURNAMENT.ACTIVE, () =>
        seedActive(ctx),
      ),
      mixed: await skipIfTournamentExists(ctx, TOURNAMENT.MIXED, () =>
        seedMixed(ctx),
      ),
    };

    const joinRequests = await seedJoinRequestsForCaptains(ctx);
    const notifications = await seedNotificationsForAdmin(ctx);

    return { roles, tournaments, joinRequests, notifications };
  },
});

/**
 * Attaches a pool of evidence storage IDs to seeded submissions that have
 * no evidence yet. Each submission receives 1–3 IDs cycled from the pool.
 */
export const attachEvidence = internalMutation({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (
    ctx,
    args,
  ): Promise<{ evidenceAttached: number; eligible: number }> => {
    if (args.storageIds.length === 0) {
      return { evidenceAttached: 0, eligible: 0 };
    }

    const seedUsers = (await ctx.db.query("users").collect()).filter((u) =>
      u.externalId.startsWith("seed_"),
    );
    const seedUserIds = new Set(seedUsers.map((u) => u._id));
    const seedTeamIds = new Set(
      (await ctx.db.query("teams").collect())
        .filter((t) => seedUserIds.has(t.createdBy))
        .map((t) => t._id),
    );

    const eligible = (await ctx.db.query("submissions").collect()).filter(
      (s) =>
        seedTeamIds.has(s.teamId) &&
        s.state !== "deleted" &&
        (s.evidenceStorageIds === undefined ||
          s.evidenceStorageIds.length === 0),
    );

    let updated = 0;
    for (let i = 0; i < eligible.length; i++) {
      const submission = eligible[i];
      const count = (i % 3) + 1;
      const startIdx = i % args.storageIds.length;
      const ids: Id<"_storage">[] = [];
      for (let j = 0; j < count; j++) {
        ids.push(args.storageIds[(startIdx + j) % args.storageIds.length]);
      }
      await ctx.db.patch(submission._id, { evidenceStorageIds: ids });
      updated++;
    }

    return { evidenceAttached: updated, eligible: eligible.length };
  },
});

/**
 * Initializes (or refreshes) the system roles table. Bootstrap entry point —
 * `role/admin.ts:makeFirstUserAdmin` calls this when the roles table is
 * empty. Idempotent.
 */
export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => upsertRoles(ctx),
});

/**
 * Deletes every artifact produced by `seed`: tournaments, teams, members,
 * submissions, submission groups, join requests, notifications, role
 * mappings, the `seed_`-prefixed users themselves, and the evidence blobs
 * that were attached to seeded submissions.
 */
export const clearAllSeeded = internalMutation({
  args: {},
  handler: async (ctx) => {
    const seedUsers = (await ctx.db.query("users").collect()).filter((u) =>
      u.externalId.startsWith("seed_"),
    );
    const seedUserIds = new Set(seedUsers.map((u) => u._id));

    const allTeams = await ctx.db.query("teams").collect();
    const seedTeams = allTeams.filter((t) => seedUserIds.has(t.createdBy));
    const seedTournamentIds = Array.from(
      new Set(seedTeams.map((t) => t.tournamentId)),
    );

    let teamMembersDeleted = 0;
    let submissionsDeleted = 0;
    let submissionGroupsDeleted = 0;
    let joinRequestsDeleted = 0;
    const evidenceStorageIds = new Set<Id<"_storage">>();

    for (const tournamentId of seedTournamentIds) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
        .collect();

      for (const team of teams) {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const m of members) {
          await ctx.db.delete(m._id);
          teamMembersDeleted++;
        }

        const subs = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const s of subs) {
          for (const sid of s.evidenceStorageIds ?? []) {
            evidenceStorageIds.add(sid);
          }
          await ctx.db.delete(s._id);
          submissionsDeleted++;
        }

        const groups = await ctx.db
          .query("submissionGroups")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const g of groups) {
          await ctx.db.delete(g._id);
          submissionGroupsDeleted++;
        }

        const requests = await ctx.db
          .query("joinRequests")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const r of requests) {
          await ctx.db.delete(r._id);
          joinRequestsDeleted++;
        }

        await ctx.db.delete(team._id);
      }

      await ctx.db.delete(tournamentId);
    }

    let notificationsDeleted = 0;
    let userRolesDeleted = 0;
    let notificationPrefsDeleted = 0;

    for (const user of seedUsers) {
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_read", (q) => q.eq("userId", user._id))
        .collect();
      for (const n of notifications) {
        await ctx.db.delete(n._id);
        notificationsDeleted++;
      }

      const prefs = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const p of prefs) {
        await ctx.db.delete(p._id);
        notificationPrefsDeleted++;
      }

      const roles = await ctx.db
        .query("userRoles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const r of roles) {
        await ctx.db.delete(r._id);
        userRolesDeleted++;
      }

      await ctx.db.delete(user._id);
    }

    // try/catch on each storage delete — a manual clean or test fixture may
    // have already removed the underlying blob.
    let evidenceBlobsDeleted = 0;
    for (const sid of evidenceStorageIds) {
      try {
        await ctx.storage.delete(sid);
        evidenceBlobsDeleted++;
      } catch {
        // already gone — ignore
      }
    }

    return {
      tournamentsDeleted: seedTournamentIds.length,
      teamsDeleted: seedTeams.length,
      teamMembersDeleted,
      submissionsDeleted,
      submissionGroupsDeleted,
      joinRequestsDeleted,
      notificationsDeleted,
      notificationPrefsDeleted,
      userRolesDeleted,
      usersDeleted: seedUsers.length,
      evidenceBlobsDeleted,
    };
  },
});

// ───────────────────────────────────────────────────────────────────────────
// Internal helpers — orchestration
// ───────────────────────────────────────────────────────────────────────────

async function skipIfTournamentExists<T>(
  ctx: MutationCtx,
  tournamentName: string,
  run: () => Promise<T>,
): Promise<T | { skipped: true; reason: string }> {
  const existing = await ctx.db
    .query("tournaments")
    .withIndex("by_name", (q) => q.eq("name", tournamentName))
    .first();
  if (existing) return { skipped: true, reason: "already exists" };
  return await run();
}

async function upsertRoles(ctx: MutationCtx) {
  const upserted: string[] = [];
  for (const roleData of rolesToCreate) {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", roleData.name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: roleData.displayName,
        description: roleData.description,
        hierarchy: roleData.hierarchy,
      });
    } else {
      await ctx.db.insert("roles", roleData);
    }
    upserted.push(roleData.name);
  }
  return { roles: upserted };
}

// ───────────────────────────────────────────────────────────────────────────
// Internal helpers — users and teams
// ───────────────────────────────────────────────────────────────────────────

async function getOrCreateUser(
  ctx: MutationCtx,
  userData: { name: string; email: string },
) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", userData.email))
    .first();
  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    name: userData.name,
    email: userData.email,
    externalId: `seed_${userData.email.replace(/[^a-z0-9]/gi, "_")}`,
  });

  const playerRole = await ctx.db
    .query("roles")
    .withIndex("by_name", (q) => q.eq("name", "player"))
    .first();
  if (playerRole) {
    await ctx.db.insert("userRoles", {
      userId,
      roleId: playerRole._id,
      assignedAt: nowUTC(),
    });
  }

  return (await ctx.db.get(userId)) as NonNullable<Doc<"users">>;
}

async function getOrCreateSeedAdmin(ctx: MutationCtx) {
  return await getOrCreateUser(ctx, {
    name: "Seed Admin",
    email: "seed_admin@example.com",
  });
}

type TeamSeedMode = "full" | "captainsOnly" | "partial";

interface AddedTeam {
  teamId: Id<"teams">;
  teamName: string;
  captainId: Id<"users">;
  memberIds: Id<"users">[];
}

interface AddTeamsOptions {
  tournamentId: Id<"tournaments">;
  /** "mixed" rotates `full` → `partial` → `captainsOnly` across teams. */
  mode: TeamSeedMode | "mixed";
  /** "mixed" alternates open/closed across teams. */
  joinPolicy?: "open" | "closed" | "mixed";
  /** Assigns descending starter points so the leaderboard isn't flat. */
  pointSpread?: boolean;
}

async function addTeams(
  ctx: MutationCtx,
  options: AddTeamsOptions,
): Promise<AddedTeam[]> {
  const created: AddedTeam[] = [];
  const modeCycle: TeamSeedMode[] = ["full", "partial", "captainsOnly"];

  for (let i = 0; i < teamsData.length; i++) {
    const teamData = teamsData[i];
    const captainUser = await getOrCreateUser(ctx, teamData.captain);

    const joinPolicy =
      options.joinPolicy === "mixed"
        ? i % 2 === 0
          ? "open"
          : "closed"
        : (options.joinPolicy ?? "open");

    const mode: TeamSeedMode =
      options.mode === "mixed" ? modeCycle[i % modeCycle.length] : options.mode;

    const points = options.pointSpread ? (teamsData.length - i) * 50 : 0;

    const teamId = await ctx.db.insert("teams", {
      name: teamData.name,
      tournamentId: options.tournamentId,
      createdBy: captainUser._id,
      joinPolicy,
      maxMembers: 5,
      points,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: captainUser._id,
      role: "captain",
    });

    const memberIds: Id<"users">[] = [captainUser._id];

    if (mode !== "captainsOnly") {
      const membersToAdd =
        mode === "partial"
          ? teamData.members.slice(0, Math.ceil(teamData.members.length / 2))
          : teamData.members;

      for (const memberData of membersToAdd) {
        const memberUser = await getOrCreateUser(ctx, memberData);
        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberUser._id,
          role: "member",
        });
        memberIds.push(memberUser._id);
      }
    }

    created.push({
      teamId,
      teamName: teamData.name,
      captainId: captainUser._id,
      memberIds,
    });
  }

  return created;
}

// ───────────────────────────────────────────────────────────────────────────
// Internal helpers — submissions and groups
// ───────────────────────────────────────────────────────────────────────────

interface IndividualSubmissionSeed {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
  userId: Id<"users">;
  date: string;
  state: "pending" | "approved" | "rejected" | "deleted";
  tier: "base" | "advanced";
  description?: string;
  managedBy?: Id<"users">;
}

async function insertIndividualSubmission(
  ctx: MutationCtx,
  s: IndividualSubmissionSeed,
) {
  return await ctx.db.insert("submissions", {
    userId: s.userId,
    teamId: s.teamId,
    tournamentId: s.tournamentId,
    date: s.date,
    description: s.description,
    submissionType: "individual",
    state: s.state,
    createdBy: s.userId,
    tier: s.tier,
    pointsEarned:
      s.state === "approved" ? DEFAULT_SCORING.individualPoints[s.tier] : 0,
    managedBy: s.managedBy,
    ...(s.state !== "pending" && { reviewedAt: Date.now() }),
  });
}

interface TeamGroupSeed {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
  /** Subset of team members that submitted into this group. */
  memberIds: Id<"users">[];
  /** Total team headcount, used for the participation rate. */
  totalTeamMembers: number;
  date: string;
  state: "pending" | "approved" | "rejected";
  tier: "base" | "advanced";
  description?: string;
  /** Reviewer for approved/rejected groups. */
  managedBy?: Id<"users">;
}

/**
 * Inserts a `submissionGroups` row plus the per-user team submissions that
 * reference it. Mirrors `lifecycle/submissions.ts` so seeded groups line up
 * with what the review queue and details page expect (group carries the
 * full point value; each member submission carries the per-head share).
 */
async function insertTeamGroup(ctx: MutationCtx, s: TeamGroupSeed) {
  const now = nowUTC();
  const participantCount = s.memberIds.length;
  const participationRate =
    s.totalTeamMembers > 0 ? participantCount / s.totalTeamMembers : 0;
  const isTeamExercise =
    participationRate >= DEFAULT_SCORING.teamExerciseThreshold;
  const groupPoints =
    s.state === "approved"
      ? isTeamExercise
        ? DEFAULT_SCORING.teamExercisePoints[s.tier]
        : DEFAULT_SCORING.individualPoints[s.tier]
      : 0;

  const groupId = await ctx.db.insert("submissionGroups", {
    teamId: s.teamId,
    tournamentId: s.tournamentId,
    date: s.date,
    state: s.state,
    tier: s.tier,
    participantCount,
    totalTeamMembers: s.totalTeamMembers,
    participationRate,
    isTeamExercise,
    pointsEarned: groupPoints,
    managedBy: s.managedBy,
    createdAt: now,
    updatedAt: now,
  });

  const pointsPerSub =
    s.state === "approved" && participantCount > 0
      ? groupPoints / participantCount
      : 0;

  const reviewedAt = s.state !== "pending" ? Date.now() : undefined;
  for (const userId of s.memberIds) {
    await ctx.db.insert("submissions", {
      userId,
      teamId: s.teamId,
      tournamentId: s.tournamentId,
      date: s.date,
      description: s.description,
      submissionType: "team",
      state: s.state,
      createdBy: userId,
      tier: s.tier,
      pointsEarned: pointsPerSub,
      submissionGroupId: groupId,
      managedBy: s.managedBy,
      ...(reviewedAt !== undefined && { reviewedAt }),
    });
  }

  return groupId;
}

// ───────────────────────────────────────────────────────────────────────────
// Internal helpers — per-tournament seeders
// ───────────────────────────────────────────────────────────────────────────

async function createTournament(
  ctx: MutationCtx,
  opts: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
  },
) {
  const admin = await getOrCreateSeedAdmin(ctx);
  const tournamentId = await ctx.db.insert("tournaments", {
    name: opts.name,
    description: opts.description,
    startDate: opts.startDate,
    endDate: opts.endDate,
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: admin._id,
    scoringConfig: DEFAULT_SCORING,
  });
  return { tournamentId, admin };
}

async function seedTournament2024(ctx: MutationCtx) {
  const { tournamentId } = await createTournament(ctx, {
    name: TOURNAMENT.T2024,
    description: "Sample tournament with seeded teams and participants",
    startDate: new Date("2025-09-12").toISOString(),
    endDate: new Date("2025-12-12").toISOString(),
  });
  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function seedTournament2026(ctx: MutationCtx) {
  const { tournamentId } = await createTournament(ctx, {
    name: TOURNAMENT.T2026,
    description: "Sample 2026 tournament with seeded teams and participants",
    startDate: new Date("2026-09-12").toISOString(),
    endDate: new Date("2026-12-12").toISOString(),
  });
  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function seedCaptainsCup(ctx: MutationCtx) {
  const { tournamentId } = await createTournament(ctx, {
    name: TOURNAMENT.CAPTAINS,
    description: "Captains-only seed for testing join/invite flows",
    startDate: new Date("2026-04-01").toISOString(),
    endDate: new Date("2026-08-01").toISOString(),
  });
  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "captainsOnly",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function seedUpcoming(ctx: MutationCtx) {
  const { tournamentId } = await createTournament(ctx, {
    name: TOURNAMENT.UPCOMING,
    description: "Upcoming tournament with full teams and no submissions",
    startDate: new Date("2026-09-01").toISOString(),
    endDate: new Date("2026-12-31").toISOString(),
  });
  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function seedEnded(ctx: MutationCtx) {
  const startDate = new Date("2025-03-01").toISOString();
  const endDate = new Date("2025-06-30").toISOString();
  const { tournamentId } = await createTournament(ctx, {
    name: TOURNAMENT.ENDED,
    description: "Completed tournament with winner and historical results",
    startDate,
    endDate,
  });
  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
    pointSpread: true,
  });

  const sampleDates = [
    "2025-03-15",
    "2025-04-01",
    "2025-04-20",
    "2025-05-10",
    "2025-06-05",
  ];

  let submissionsCreated = 0;
  for (const team of teams) {
    for (let i = 0; i < sampleDates.length; i++) {
      await insertIndividualSubmission(ctx, {
        teamId: team.teamId,
        tournamentId,
        userId: team.memberIds[i % team.memberIds.length],
        date: sampleDates[i],
        state: "approved",
        tier: i % 2 === 0 ? "base" : "advanced",
        description: `Historical submission ${i + 1}`,
      });
      submissionsCreated++;
    }
  }

  await ctx.db.patch(tournamentId, {
    winnerId: teams[0].teamId,
    completedAt: endDate,
  });

  return {
    tournamentId,
    teamsCreated: teams.length,
    submissionsCreated,
    winnerTeamId: teams[0].teamId,
  };
}

async function seedActive(ctx: MutationCtx) {
  const { tournamentId, admin } = await createTournament(ctx, {
    name: TOURNAMENT.ACTIVE,
    description: "Active tournament with submissions in every state",
    startDate: new Date("2026-03-01").toISOString(),
    endDate: new Date("2026-08-31").toISOString(),
  });

  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
    pointSpread: true,
  });

  const individualPlan: Array<{
    state: IndividualSubmissionSeed["state"];
    tier: IndividualSubmissionSeed["tier"];
    date: string;
    description: string;
    managedByAdmin: boolean;
  }> = [
    {
      state: "pending",
      tier: "base",
      date: "2026-05-01",
      description: "Pending base individual",
      managedByAdmin: false,
    },
    {
      state: "approved",
      tier: "base",
      date: "2026-04-20",
      description: "Approved base individual",
      managedByAdmin: true,
    },
    {
      state: "approved",
      tier: "advanced",
      date: "2026-04-22",
      description: "Approved advanced individual",
      managedByAdmin: true,
    },
    {
      state: "rejected",
      tier: "base",
      date: "2026-04-15",
      description: "Rejected — insufficient evidence",
      managedByAdmin: true,
    },
    {
      state: "deleted",
      tier: "base",
      date: "2026-04-10",
      description: "Withdrawn submission",
      managedByAdmin: true,
    },
  ];

  let submissionsCreated = 0;
  for (const team of teams) {
    for (const plan of individualPlan) {
      await insertIndividualSubmission(ctx, {
        teamId: team.teamId,
        tournamentId,
        userId: team.memberIds[submissionsCreated % team.memberIds.length],
        date: plan.date,
        state: plan.state,
        tier: plan.tier,
        description: plan.description,
        managedBy: plan.managedByAdmin ? admin._id : undefined,
      });
      submissionsCreated++;
    }
  }

  // Three team groups per team to exercise the group review surface in
  // every state. Headcounts pick the participation rate so each lands on
  // a sensible isTeamExercise verdict for its tier.
  const teamGroupPlan: Array<{
    state: TeamGroupSeed["state"];
    tier: TeamGroupSeed["tier"];
    date: string;
    description: string;
    memberCount: number;
    managedByAdmin: boolean;
  }> = [
    {
      state: "pending",
      tier: "advanced",
      date: "2026-05-02",
      description: "Pending advanced team activity — full team workout",
      memberCount: 4,
      managedByAdmin: false,
    },
    {
      state: "approved",
      tier: "base",
      date: "2026-04-25",
      description: "Approved base team activity — group run",
      memberCount: 3,
      managedByAdmin: true,
    },
    {
      state: "rejected",
      tier: "advanced",
      date: "2026-04-12",
      description: "Rejected team activity — too few participants logged",
      memberCount: 2,
      managedByAdmin: true,
    },
  ];

  let groupsCreated = 0;
  for (const team of teams) {
    for (const plan of teamGroupPlan) {
      const memberIds = team.memberIds.slice(
        0,
        Math.min(plan.memberCount, team.memberIds.length),
      );
      if (memberIds.length === 0) continue;
      await insertTeamGroup(ctx, {
        teamId: team.teamId,
        tournamentId,
        memberIds,
        totalTeamMembers: team.memberIds.length,
        date: plan.date,
        state: plan.state,
        tier: plan.tier,
        description: plan.description,
        managedBy: plan.managedByAdmin ? admin._id : undefined,
      });
      groupsCreated++;
      submissionsCreated += memberIds.length;
    }
  }

  return {
    tournamentId,
    teamsCreated: teams.length,
    submissionsCreated,
    groupsCreated,
  };
}

async function seedMixed(ctx: MutationCtx) {
  const { tournamentId } = await createTournament(ctx, {
    name: TOURNAMENT.MIXED,
    description: "Active tournament with mixed team join policies and sizes",
    startDate: new Date("2026-04-15").toISOString(),
    endDate: new Date("2026-09-15").toISOString(),
  });
  const teams = await addTeams(ctx, {
    tournamentId,
    mode: "mixed",
    joinPolicy: "mixed",
  });
  return { tournamentId, teamsCreated: teams.length };
}

// ───────────────────────────────────────────────────────────────────────────
// Internal helpers — join requests and notifications
// ───────────────────────────────────────────────────────────────────────────

async function seedJoinRequestsForCaptains(ctx: MutationCtx) {
  const tournament = await ctx.db
    .query("tournaments")
    .withIndex("by_name", (q) => q.eq("name", TOURNAMENT.CAPTAINS))
    .first();
  if (!tournament) return { skipped: true, reason: "captains cup not found" };

  const teams = await ctx.db
    .query("teams")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
    .collect();
  if (teams.length === 0) return { skipped: true, reason: "no teams" };

  // Skip if any join request already targets these teams — keeps re-runs idempotent.
  const existing = await ctx.db
    .query("joinRequests")
    .withIndex("by_team", (q) => q.eq("teamId", teams[0]._id))
    .first();
  if (existing) return { skipped: true, reason: "already seeded" };

  const admin = await getOrCreateSeedAdmin(ctx);
  const now = nowUTC();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + sevenDays).toISOString();
  const expiredAt = new Date(Date.now() - sevenDays).toISOString();

  const requesterPool = [
    { name: "Joana Hopeful", email: "seed_joana_hopeful@example.com" },
    { name: "Pedro Ready", email: "seed_pedro_ready@example.com" },
    { name: "Marta Eager", email: "seed_marta_eager@example.com" },
    { name: "Bruno Patient", email: "seed_bruno_patient@example.com" },
    { name: "Sofia Curious", email: "seed_sofia_curious@example.com" },
  ];

  const plans: Array<{
    status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
    initiator: "user" | "team";
    respond: boolean;
    expires: string;
  }> = [
    {
      status: "pending",
      initiator: "user",
      respond: false,
      expires: expiresAt,
    },
    {
      status: "pending",
      initiator: "team",
      respond: false,
      expires: expiresAt,
    },
    {
      status: "accepted",
      initiator: "user",
      respond: true,
      expires: expiresAt,
    },
    {
      status: "rejected",
      initiator: "user",
      respond: true,
      expires: expiresAt,
    },
    {
      status: "cancelled",
      initiator: "team",
      respond: true,
      expires: expiresAt,
    },
    {
      status: "expired",
      initiator: "user",
      respond: false,
      expires: expiredAt,
    },
  ];

  let created = 0;
  for (let i = 0; i < plans.length; i++) {
    const team = teams[i % teams.length];
    const requester = requesterPool[i % requesterPool.length];
    const requesterUser = await getOrCreateUser(ctx, requester);
    const config = plans[i];
    const createdBy =
      config.initiator === "user" ? requesterUser._id : admin._id;

    await ctx.db.insert("joinRequests", {
      teamId: team._id,
      userId: requesterUser._id,
      status: config.status,
      message:
        config.initiator === "user"
          ? "I'd love to join your team!"
          : "We'd like to invite you to our team.",
      createdAt: now,
      respondedAt: config.respond ? now : undefined,
      respondedBy: config.respond ? admin._id : undefined,
      initiator: config.initiator,
      createdBy,
      expiresAt: config.expires,
    });
    created++;
  }

  return { joinRequestsCreated: created };
}

async function seedNotificationsForAdmin(ctx: MutationCtx) {
  const admin = await getOrCreateSeedAdmin(ctx);

  // Skip if any notification already exists for the admin — keeps re-runs idempotent.
  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_user_and_read", (q) => q.eq("userId", admin._id))
    .first();
  if (existing) return { skipped: true, reason: "already seeded" };

  const oneHour = 60 * 60 * 1000;
  const notifications: Array<{
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    offsetMs: number;
    actionUrl?: string;
  }> = [
    {
      type: "submission_approved",
      title: "Submission approved",
      body: "Your base-tier submission was approved (+2 points).",
      isRead: false,
      offsetMs: 1 * oneHour,
      actionUrl: "/submissions",
    },
    {
      type: "submission_rejected",
      title: "Submission needs changes",
      body: "Reviewer asked for clearer evidence on your last upload.",
      isRead: false,
      offsetMs: 3 * oneHour,
      actionUrl: "/submissions",
    },
    {
      type: "join_request_received",
      title: "New join request",
      body: "Joana Hopeful wants to join your team.",
      isRead: false,
      offsetMs: 6 * oneHour,
      actionUrl: "/teams",
    },
    {
      type: "join_request_accepted",
      title: "You're in!",
      body: "Your join request to Urban Divas was accepted.",
      isRead: true,
      offsetMs: 24 * oneHour,
      actionUrl: "/teams",
    },
    {
      type: "tournament_started",
      title: "Tournament kicked off",
      body: "Urban Legends Live Cup 2026 is now active.",
      isRead: true,
      offsetMs: 48 * oneHour,
      actionUrl: "/tournaments",
    },
    {
      type: "daily_digest",
      title: "Daily digest",
      body: "3 new submissions and 1 leaderboard change since yesterday.",
      isRead: true,
      offsetMs: 72 * oneHour,
    },
  ];

  let created = 0;
  for (const n of notifications) {
    const createdAt = new Date(Date.now() - n.offsetMs).toISOString();
    await ctx.db.insert("notifications", {
      userId: admin._id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      isDeleted: false,
      createdAt,
      actionUrl: n.actionUrl,
    });
    created++;
  }

  const prefs = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_user", (q) => q.eq("userId", admin._id))
    .first();
  if (!prefs) {
    await ctx.db.insert("notificationPreferences", {
      userId: admin._id,
      dailyDigestEnabled: true,
      timezone: "Europe/Lisbon",
      updatedAt: nowUTC(),
    });
  }

  return { notificationsCreated: created };
}

// ───────────────────────────────────────────────────────────────────────────
// Random submission fill
// ───────────────────────────────────────────────────────────────────────────

/**
 * Action wrapper: fetches the demo evidence images, then runs the mutation
 * that generates random submissions and attaches images to the new rows.
 */
interface SeedRandomSubmissionsResult {
  tournamentName: string;
  submissionsCreated: number;
  teamsTouched?: number;
  daysCovered?: number;
  groupsCreated?: number;
  storageIdsCreated: number;
}

export const seedRandomSubmissions = internalAction({
  args: {
    tournamentName: v.string(),
    maxPerTeamPerDay: v.optional(v.number()),
    seed: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SeedRandomSubmissionsResult> => {
    const storageIds: Id<"_storage">[] = [];
    for (const url of DEMO_EVIDENCE_URLS) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      storageIds.push(await ctx.storage.store(blob));
    }
    const result = await ctx.runMutation(
      internal.seed.seedRandomSubmissionsDb,
      { ...args, storageIds },
    );
    return { ...result, storageIdsCreated: storageIds.length };
  },
});

/**
 * Generate pending submissions for every team in a tournament across every
 * day from start date up to today (or the tournament end date, whichever is
 * earlier). Randomly mixes tiers and individual/team types so leaderboards
 * and review queues look populated. Each created submission/group gets
 * 1–3 evidence images cycled from the provided pool.
 */
export const seedRandomSubmissionsDb = internalMutation({
  args: {
    tournamentName: v.string(),
    maxPerTeamPerDay: v.optional(v.number()),
    seed: v.optional(v.number()),
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    tournamentName: string;
    submissionsCreated: number;
    teamsTouched?: number;
    daysCovered?: number;
    groupsCreated?: number;
  }> => {
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", args.tournamentName))
      .first();
    if (!tournament) {
      throw new Error(`Tournament "${args.tournamentName}" not found`);
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .collect();
    if (teams.length === 0) {
      throw new Error(`Tournament "${args.tournamentName}" has no teams`);
    }

    const rng = makeRng(args.seed ?? 1337);
    const maxPerTeamPerDay = args.maxPerTeamPerDay ?? 3;

    const startMs = new Date(tournament.startDate).getTime();
    const endMs = Math.min(new Date(tournament.endDate).getTime(), Date.now());
    if (endMs < startMs) {
      return { tournamentName: args.tournamentName, submissionsCreated: 0 };
    }
    const totalDays = Math.floor((endMs - startMs) / 86_400_000);
    const dates = Array.from({ length: totalDays + 1 }, (_, i) =>
      new Date(startMs + i * 86_400_000).toISOString().slice(0, 10),
    );

    let submissionsCreated = 0;
    let groupsCreated = 0;
    let evidenceCursor = 0;
    const pickEvidence = (): Id<"_storage">[] => {
      if (args.storageIds.length === 0) return [];
      const count = 1 + Math.floor(rng() * 3);
      const ids: Id<"_storage">[] = [];
      for (let j = 0; j < count; j++) {
        ids.push(
          args.storageIds[(evidenceCursor + j) % args.storageIds.length],
        );
      }
      evidenceCursor = (evidenceCursor + count) % args.storageIds.length;
      return ids;
    };

    for (const team of teams) {
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      if (members.length === 0) continue;

      // Skip ~30% of teams entirely so some teams look quiet.
      if (rng() < 0.3) continue;

      for (const date of dates) {
        // Only ~40% of days have any activity for this team.
        if (rng() > 0.4) continue;
        const count = 1 + Math.floor(rng() * maxPerTeamPerDay);
        for (let i = 0; i < count; i++) {
          const tier: "base" | "advanced" = rng() < 0.7 ? "base" : "advanced";
          const isTeam = rng() < 0.15;

          const evidenceIds = pickEvidence();

          if (isTeam) {
            const subset = members
              .filter(() => rng() < 0.6)
              .map((m) => m.userId);
            const memberIds =
              subset.length > 0
                ? subset
                : [members[Math.floor(rng() * members.length)].userId];
            const groupId = await insertTeamGroup(ctx, {
              teamId: team._id,
              tournamentId: tournament._id,
              memberIds,
              totalTeamMembers: members.length,
              date,
              state: "pending",
              tier,
              description: `Random ${tier} team submission on ${date}`,
            });
            groupsCreated++;
            submissionsCreated += memberIds.length;
            if (evidenceIds.length > 0) {
              const memberSubs = await ctx.db
                .query("submissions")
                .withIndex("by_group", (q) =>
                  q.eq("submissionGroupId", groupId),
                )
                .collect();
              for (const sub of memberSubs) {
                await ctx.db.patch(sub._id, {
                  evidenceStorageIds: evidenceIds,
                });
              }
            }
          } else {
            const member = members[Math.floor(rng() * members.length)];
            const subId = await insertIndividualSubmission(ctx, {
              teamId: team._id,
              tournamentId: tournament._id,
              userId: member.userId,
              date,
              state: "pending",
              tier,
              description: `Random ${tier} individual submission on ${date}`,
            });
            submissionsCreated++;
            if (evidenceIds.length > 0) {
              await ctx.db.patch(subId, { evidenceStorageIds: evidenceIds });
            }
          }
        }
      }
    }

    return {
      tournamentName: args.tournamentName,
      teamsTouched: teams.length,
      daysCovered: dates.length,
      groupsCreated,
      submissionsCreated,
    };
  },
});

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
