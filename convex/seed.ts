import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, internalMutation } from "./_generated/server";
import { rolesToCreate, teamsData } from "./data";
import { nowUTC } from "./lib/dates";

/**
 * Seed mutation to populate the database with sample tournament and teams.
 * This creates a tournament with real team data and assigns users to teams.
 *
 * Admin only. Run this mutation from the Convex dashboard or CLI.
 */
export const seedTournamentAndTeams = internalMutation({
  args: {
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Tournament 2024";

    const existingTournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();

    if (existingTournament) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Sample tournament with seeded teams and participants",
      startDate: new Date("2025-09-12").toISOString(),
      endDate: new Date("2025-12-12").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: "kh776hrvgra829xcxgf7hj7kzn7t3ny0" as Id<"users">,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const createdTeams = [];

    for (const teamData of teamsData) {
      const captainUser = await getOrCreateUser(ctx, {
        name: teamData.captain.name,
        email: teamData.captain.email,
      });

      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        tournamentId,
        createdBy: captainUser._id,
        joinPolicy: "open",
        maxMembers: 5,
        points: 0,
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: captainUser._id,
        role: "captain",
      });

      for (const memberData of teamData.members) {
        const memberUser = await getOrCreateUser(ctx, {
          name: memberData.name,
          email: memberData.email,
        });

        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberUser._id,
          role: "member",
        });
      }

      createdTeams.push({
        teamId,
        teamName: teamData.name,
        captainName: teamData.captain.name,
        memberCount: teamData.members.length + 1,
      });
    }

    return {
      tournamentId,
      tournamentName,
      teamsCreated: createdTeams.length,
      teams: createdTeams,
    };
  },
});

/**
 * Seed mutation to populate the database with a 2026 tournament and teams.
 * Mirrors `seedTournamentAndTeams` but with 2026 dates so the tournament is
 * active/relevant when running on a current dev environment.
 *
 * Admin only. Run this mutation from the Convex dashboard or CLI.
 */
export const seedTournamentAndTeams2026 = internalMutation({
  args: {
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Tournament 2026";

    const existingTournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();

    if (existingTournament) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Sample 2026 tournament with seeded teams and participants",
      startDate: new Date("2026-09-12").toISOString(),
      endDate: new Date("2026-12-12").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: "kh776hrvgra829xcxgf7hj7kzn7t3ny0" as Id<"users">,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const createdTeams = [];

    for (const teamData of teamsData) {
      const captainUser = await getOrCreateUser(ctx, {
        name: teamData.captain.name,
        email: teamData.captain.email,
      });

      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        tournamentId,
        createdBy: captainUser._id,
        joinPolicy: "open",
        maxMembers: 5,
        points: 0,
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: captainUser._id,
        role: "captain",
      });

      for (const memberData of teamData.members) {
        const memberUser = await getOrCreateUser(ctx, {
          name: memberData.name,
          email: memberData.email,
        });

        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberUser._id,
          role: "member",
        });
      }

      createdTeams.push({
        teamId,
        teamName: teamData.name,
        captainName: teamData.captain.name,
        memberCount: teamData.members.length + 1,
      });
    }

    return {
      tournamentId,
      tournamentName,
      teamsCreated: createdTeams.length,
      teams: createdTeams,
    };
  },
});

/**
 * Seed mutation to populate the database with a tournament and teams where
 * each team only has its captain (no other members). Useful for testing
 * join-request and team-invitation flows on empty teams.
 *
 * Admin only. Run this mutation from the Convex dashboard or CLI.
 */
export const seedTournamentAndCaptains = internalMutation({
  args: {
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Captains Cup 2026";

    const existingTournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();

    if (existingTournament) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Sample tournament seeded with captains only",
      startDate: new Date("2026-04-01").toISOString(),
      endDate: new Date("2026-08-01").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: "kh776hrvgra829xcxgf7hj7kzn7t3ny0" as Id<"users">,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const createdTeams = [];

    for (const teamData of teamsData) {
      const captainUser = await getOrCreateUser(ctx, {
        name: teamData.captain.name,
        email: teamData.captain.email,
      });

      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        tournamentId,
        createdBy: captainUser._id,
        joinPolicy: "open",
        maxMembers: 5,
        points: 0,
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: captainUser._id,
        role: "captain",
      });

      createdTeams.push({
        teamId,
        teamName: teamData.name,
        captainName: teamData.captain.name,
        memberCount: 1,
      });
    }

    return {
      tournamentId,
      tournamentName,
      teamsCreated: createdTeams.length,
      teams: createdTeams,
    };
  },
});

/**
 * Helper function to get or create a user by email.
 * If user doesn't exist, creates a new user with a placeholder externalId.
 */
async function getOrCreateUser(
  ctx: MutationCtx,
  userData: { name: string; email: string },
) {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", userData.email))
    .first();

  if (existingUser) {
    return existingUser;
  }

  // Create new user with placeholder externalId
  // In production, these would be synced from Clerk
  const userId = await ctx.db.insert("users", {
    name: userData.name,
    email: userData.email,
    externalId: `seed_${userData.email.replace(/[^a-z0-9]/gi, "_")}`,
  });

  const userRole = await ctx.db
    .query("roles")
    .withIndex("by_name", (q) => q.eq("name", "player"))
    .first();

  if (userRole) {
    await ctx.db.insert("userRoles", {
      userId,
      roleId: userRole._id,
      assignedAt: nowUTC(),
    });
  }

  return (await ctx.db.get(userId)) as NonNullable<Doc<"users">>;
}

/**
 * Returns a stable "Seed Admin" user, creating it if missing. Used as a safe
 * fallback `createdBy` for new seed mutations so they don't depend on a
 * hardcoded user id existing in the target environment.
 */
async function getOrCreateSeedAdmin(ctx: MutationCtx) {
  return await getOrCreateUser(ctx, {
    name: "Seed Admin",
    email: "seed_admin@example.com",
  });
}

type TeamSeedMode = "full" | "captainsOnly" | "partial";

interface AddTeamsOptions {
  tournamentId: Id<"tournaments">;
  mode: TeamSeedMode;
  joinPolicy?: "open" | "closed" | "mixed";
  pointSpread?: boolean;
}

interface AddedTeam {
  teamId: Id<"teams">;
  teamName: string;
  captainId: Id<"users">;
  memberIds: Id<"users">[];
}

async function addTeamsToTournament(
  ctx: MutationCtx,
  options: AddTeamsOptions,
): Promise<AddedTeam[]> {
  const created: AddedTeam[] = [];

  for (let i = 0; i < teamsData.length; i++) {
    const teamData = teamsData[i];

    const captainUser = await getOrCreateUser(ctx, {
      name: teamData.captain.name,
      email: teamData.captain.email,
    });

    const joinPolicy =
      options.joinPolicy === "mixed"
        ? i % 2 === 0
          ? "open"
          : "closed"
        : (options.joinPolicy ?? "open");

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

    if (options.mode !== "captainsOnly") {
      const membersToAdd =
        options.mode === "partial"
          ? teamData.members.slice(0, Math.ceil(teamData.members.length / 2))
          : teamData.members;

      for (const memberData of membersToAdd) {
        const memberUser = await getOrCreateUser(ctx, {
          name: memberData.name,
          email: memberData.email,
        });
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

interface SubmissionSeed {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
  userId: Id<"users">;
  date: string;
  state: "pending" | "approved" | "rejected" | "deleted";
  tier: "base" | "advanced";
  type: "individual" | "team";
  description?: string;
  pointsEarned?: number;
}

async function insertSubmission(ctx: MutationCtx, s: SubmissionSeed) {
  return await ctx.db.insert("submissions", {
    userId: s.userId,
    teamId: s.teamId,
    tournamentId: s.tournamentId,
    date: s.date,
    description: s.description,
    submissionType: s.type,
    state: s.state,
    createdBy: s.userId,
    tier: s.tier,
    pointsEarned: s.pointsEarned ?? (s.tier === "base" ? 2 : 3),
  });
}

/**
 * Seed mutation: an upcoming tournament with full teams and no submissions.
 * Useful for testing upcoming-status badges, registration views, and
 * empty-leaderboard / empty-submission states.
 */
export const seedUpcomingTournament = internalMutation({
  args: { tournamentName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Upcoming Cup 2026";

    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();
    if (existing) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const admin = await getOrCreateSeedAdmin(ctx);

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Upcoming tournament with full teams and no submissions",
      startDate: new Date("2026-09-01").toISOString(),
      endDate: new Date("2026-12-31").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: admin._id,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const teams = await addTeamsToTournament(ctx, {
      tournamentId,
      mode: "full",
      joinPolicy: "open",
    });

    return {
      tournamentId,
      tournamentName,
      teamsCreated: teams.length,
    };
  },
});

/**
 * Seed mutation: a tournament that has already ended, with a winner set,
 * a point spread across teams, and approved submissions backfilled across
 * the tournament window. Useful for testing leaderboards, completed-state
 * badges, and historical submission views.
 */
export const seedEndedTournament = internalMutation({
  args: { tournamentName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Legacy Cup 2025";

    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();
    if (existing) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const admin = await getOrCreateSeedAdmin(ctx);

    const startDate = new Date("2025-03-01").toISOString();
    const endDate = new Date("2025-06-30").toISOString();

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Completed tournament with winner and historical results",
      startDate,
      endDate,
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: admin._id,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const teams = await addTeamsToTournament(ctx, {
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

    let submissionCount = 0;
    for (const team of teams) {
      for (let i = 0; i < sampleDates.length; i++) {
        const date = sampleDates[i];
        const userId = team.memberIds[i % team.memberIds.length];
        await insertSubmission(ctx, {
          teamId: team.teamId,
          tournamentId,
          userId,
          date,
          state: "approved",
          tier: i % 2 === 0 ? "base" : "advanced",
          type: "individual",
          description: `Historical submission ${i + 1}`,
        });
        submissionCount++;
      }
    }

    const winner = teams[0];
    await ctx.db.patch(tournamentId, {
      winnerId: winner.teamId,
      completedAt: endDate,
    });

    return {
      tournamentId,
      tournamentName,
      teamsCreated: teams.length,
      submissionsCreated: submissionCount,
      winnerTeamId: winner.teamId,
      winnerTeamName: winner.teamName,
    };
  },
});

/**
 * Seed mutation: a currently-active tournament with full teams and
 * submissions across every state, tier, and type. Useful for testing
 * review queues, approval flows, and submission history filters.
 */
export const seedActiveWithSubmissions = internalMutation({
  args: { tournamentName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tournamentName = args.tournamentName || "Urban Legends Live Cup 2026";

    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();
    if (existing) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const admin = await getOrCreateSeedAdmin(ctx);

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Active tournament with submissions in every state",
      startDate: new Date("2026-03-01").toISOString(),
      endDate: new Date("2026-08-31").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: admin._id,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const teams = await addTeamsToTournament(ctx, {
      tournamentId,
      mode: "full",
      joinPolicy: "open",
      pointSpread: true,
    });

    const submissionPlan: Array<{
      state: SubmissionSeed["state"];
      tier: SubmissionSeed["tier"];
      type: SubmissionSeed["type"];
      date: string;
      description: string;
    }> = [
      {
        state: "pending",
        tier: "base",
        type: "individual",
        date: "2026-05-01",
        description: "Pending base individual",
      },
      {
        state: "pending",
        tier: "advanced",
        type: "team",
        date: "2026-05-02",
        description: "Pending advanced team exercise",
      },
      {
        state: "approved",
        tier: "base",
        type: "individual",
        date: "2026-04-20",
        description: "Approved base individual",
      },
      {
        state: "approved",
        tier: "advanced",
        type: "individual",
        date: "2026-04-22",
        description: "Approved advanced individual",
      },
      {
        state: "rejected",
        tier: "base",
        type: "individual",
        date: "2026-04-15",
        description: "Rejected — insufficient evidence",
      },
      {
        state: "deleted",
        tier: "base",
        type: "individual",
        date: "2026-04-10",
        description: "Withdrawn submission",
      },
    ];

    let submissionCount = 0;
    for (const team of teams) {
      for (const plan of submissionPlan) {
        const userId = team.memberIds[submissionCount % team.memberIds.length];
        await insertSubmission(ctx, {
          teamId: team.teamId,
          tournamentId,
          userId,
          ...plan,
        });
        submissionCount++;
      }
    }

    return {
      tournamentId,
      tournamentName,
      teamsCreated: teams.length,
      submissionsCreated: submissionCount,
    };
  },
});

/**
 * Seed mutation: an active tournament showcasing team variety — alternating
 * open/closed join policy and rotating between full / partial / captain-only
 * membership. Useful for testing the team-browse list, join-policy filtering,
 * and joinability gating.
 */
export const seedMixedTeams = internalMutation({
  args: { tournamentName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Mixed Mayhem 2026";

    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();
    if (existing) {
      throw new Error(`Tournament "${tournamentName}" already exists`);
    }

    const admin = await getOrCreateSeedAdmin(ctx);

    const tournamentId = await ctx.db.insert("tournaments", {
      name: tournamentName,
      description: "Active tournament with mixed team join policies and sizes",
      startDate: new Date("2026-04-15").toISOString(),
      endDate: new Date("2026-09-15").toISOString(),
      teamMinSize: 3,
      teamMaxSize: 5,
      createdBy: admin._id,
      scoringConfig: {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    });

    const created: AddedTeam[] = [];
    const modeCycle: TeamSeedMode[] = ["full", "partial", "captainsOnly"];

    for (let i = 0; i < teamsData.length; i++) {
      const teamData = teamsData[i];
      const captainUser = await getOrCreateUser(ctx, {
        name: teamData.captain.name,
        email: teamData.captain.email,
      });

      const joinPolicy = i % 2 === 0 ? "open" : "closed";
      const mode = modeCycle[i % modeCycle.length];

      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        tournamentId,
        createdBy: captainUser._id,
        joinPolicy,
        maxMembers: 5,
        points: 0,
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
          const memberUser = await getOrCreateUser(ctx, {
            name: memberData.name,
            email: memberData.email,
          });
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

    return {
      tournamentId,
      tournamentName,
      teamsCreated: created.length,
    };
  },
});

/**
 * Seed mutation: populate join requests in every state for an existing
 * tournament. Defaults to the captains-only tournament so there's plenty
 * of headroom to add members. Creates both user-initiated and team-initiated
 * requests so both inbox views can be exercised.
 */
export const seedJoinRequests = internalMutation({
  args: {
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tournamentName =
      args.tournamentName || "Urban Legends Captains Cup 2026";

    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_name", (q) => q.eq("name", tournamentName))
      .first();
    if (!tournament) {
      throw new Error(`Tournament "${tournamentName}" not found`);
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .collect();
    if (teams.length === 0) {
      throw new Error(`Tournament "${tournamentName}" has no teams to join`);
    }

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

    const states: Array<{
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
    for (let i = 0; i < states.length; i++) {
      const team = teams[i % teams.length];
      const requester = requesterPool[i % requesterPool.length];
      const requesterUser = await getOrCreateUser(ctx, requester);
      const config = states[i];
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

    return {
      tournamentName,
      joinRequestsCreated: created,
      teamsTargeted: Math.min(teams.length, states.length),
    };
  },
});

/**
 * Seed mutation: populate the notifications inbox for a target user with a
 * mix of types, read/unread states, and action URLs. Targets the seed admin
 * by default so the data is reachable without a real Clerk login; pass an
 * email to target a specific user.
 */
export const seedNotifications = internalMutation({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetEmail = args.userEmail || "seed_admin@example.com";

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", targetEmail))
      .first();
    if (!targetUser) {
      throw new Error(`User with email "${targetEmail}" not found`);
    }

    const now = nowUTC();
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
        userId: targetUser._id,
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

    await ctx.db.insert("notificationPreferences", {
      userId: targetUser._id,
      dailyDigestEnabled: true,
      timezone: "Europe/Lisbon",
      updatedAt: now,
    });

    return {
      targetEmail,
      notificationsCreated: created,
    };
  },
});

/**
 * Convenience: run every tournament seed in order on a fresh database.
 * Skips any seed whose tournament already exists, so it's safe to re-run
 * after a partial failure.
 */
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, unknown> = {};

    const tournamentSeeds: Array<{
      key: string;
      name: string;
      run: () => Promise<unknown>;
    }> = [
      {
        key: "tournament2024",
        name: "Urban Legends Tournament 2024",
        run: () => runSeedTournament2024(ctx),
      },
      {
        key: "tournament2026",
        name: "Urban Legends Tournament 2026",
        run: () => runSeedTournament2026(ctx),
      },
      {
        key: "captainsCup",
        name: "Urban Legends Captains Cup 2026",
        run: () => runSeedCaptainsCup(ctx),
      },
      {
        key: "upcoming",
        name: "Urban Legends Upcoming Cup 2026",
        run: () => runSeedUpcoming(ctx),
      },
      {
        key: "ended",
        name: "Urban Legends Legacy Cup 2025",
        run: () => runSeedEnded(ctx),
      },
      {
        key: "activeWithSubmissions",
        name: "Urban Legends Live Cup 2026",
        run: () => runSeedActiveWithSubmissions(ctx),
      },
      {
        key: "mixedTeams",
        name: "Urban Legends Mixed Mayhem 2026",
        run: () => runSeedMixedTeams(ctx),
      },
    ];

    for (const seed of tournamentSeeds) {
      const existing = await ctx.db
        .query("tournaments")
        .withIndex("by_name", (q) => q.eq("name", seed.name))
        .first();
      if (existing) {
        results[seed.key] = { skipped: true, reason: "already exists" };
        continue;
      }
      results[seed.key] = await seed.run();
    }

    results.joinRequests = await runSeedJoinRequests(ctx);
    results.notifications = await runSeedNotifications(ctx);

    return results;
  },
});

/**
 * Clear every tournament whose teams were created by seeded users, plus
 * all related teams, members, submissions, submission groups, join requests,
 * notifications, and seed_-prefixed users. Use with care — destroys all
 * seeded data across every tournament.
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

        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const s of submissions) {
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
    };
  },
});

// === Internal runners used by seedAll so we can reuse handler bodies ===

async function runSeedTournament2024(ctx: MutationCtx) {
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Tournament 2024",
    description: "Sample tournament with seeded teams and participants",
    startDate: new Date("2025-09-12").toISOString(),
    endDate: new Date("2025-12-12").toISOString(),
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const teams = await addTeamsToTournament(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function runSeedTournament2026(ctx: MutationCtx) {
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Tournament 2026",
    description: "Sample 2026 tournament with seeded teams and participants",
    startDate: new Date("2026-09-12").toISOString(),
    endDate: new Date("2026-12-12").toISOString(),
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const teams = await addTeamsToTournament(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function runSeedCaptainsCup(ctx: MutationCtx) {
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Captains Cup 2026",
    description: "Sample tournament seeded with captains only",
    startDate: new Date("2026-04-01").toISOString(),
    endDate: new Date("2026-08-01").toISOString(),
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const teams = await addTeamsToTournament(ctx, {
    tournamentId,
    mode: "captainsOnly",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function runSeedUpcoming(ctx: MutationCtx) {
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Upcoming Cup 2026",
    description: "Upcoming tournament with full teams and no submissions",
    startDate: new Date("2026-09-01").toISOString(),
    endDate: new Date("2026-12-31").toISOString(),
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const teams = await addTeamsToTournament(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
  });
  return { tournamentId, teamsCreated: teams.length };
}

async function runSeedEnded(ctx: MutationCtx) {
  const startDate = new Date("2025-03-01").toISOString();
  const endDate = new Date("2025-06-30").toISOString();
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Legacy Cup 2025",
    description: "Completed tournament with winner and historical results",
    startDate,
    endDate,
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const teams = await addTeamsToTournament(ctx, {
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
  let submissionCount = 0;
  for (const team of teams) {
    for (let i = 0; i < sampleDates.length; i++) {
      await insertSubmission(ctx, {
        teamId: team.teamId,
        tournamentId,
        userId: team.memberIds[i % team.memberIds.length],
        date: sampleDates[i],
        state: "approved",
        tier: i % 2 === 0 ? "base" : "advanced",
        type: "individual",
        description: `Historical submission ${i + 1}`,
      });
      submissionCount++;
    }
  }
  await ctx.db.patch(tournamentId, {
    winnerId: teams[0].teamId,
    completedAt: endDate,
  });
  return {
    tournamentId,
    teamsCreated: teams.length,
    submissionsCreated: submissionCount,
    winnerTeamId: teams[0].teamId,
  };
}

async function runSeedActiveWithSubmissions(ctx: MutationCtx) {
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Live Cup 2026",
    description: "Active tournament with submissions in every state",
    startDate: new Date("2026-03-01").toISOString(),
    endDate: new Date("2026-08-31").toISOString(),
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const teams = await addTeamsToTournament(ctx, {
    tournamentId,
    mode: "full",
    joinPolicy: "open",
    pointSpread: true,
  });
  const submissionPlan: Array<{
    state: SubmissionSeed["state"];
    tier: SubmissionSeed["tier"];
    type: SubmissionSeed["type"];
    date: string;
    description: string;
  }> = [
    {
      state: "pending",
      tier: "base",
      type: "individual",
      date: "2026-05-01",
      description: "Pending base individual",
    },
    {
      state: "pending",
      tier: "advanced",
      type: "team",
      date: "2026-05-02",
      description: "Pending advanced team exercise",
    },
    {
      state: "approved",
      tier: "base",
      type: "individual",
      date: "2026-04-20",
      description: "Approved base individual",
    },
    {
      state: "approved",
      tier: "advanced",
      type: "individual",
      date: "2026-04-22",
      description: "Approved advanced individual",
    },
    {
      state: "rejected",
      tier: "base",
      type: "individual",
      date: "2026-04-15",
      description: "Rejected — insufficient evidence",
    },
    {
      state: "deleted",
      tier: "base",
      type: "individual",
      date: "2026-04-10",
      description: "Withdrawn submission",
    },
  ];
  let submissionCount = 0;
  for (const team of teams) {
    for (const plan of submissionPlan) {
      await insertSubmission(ctx, {
        teamId: team.teamId,
        tournamentId,
        userId: team.memberIds[submissionCount % team.memberIds.length],
        ...plan,
      });
      submissionCount++;
    }
  }
  return {
    tournamentId,
    teamsCreated: teams.length,
    submissionsCreated: submissionCount,
  };
}

async function runSeedMixedTeams(ctx: MutationCtx) {
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Urban Legends Mixed Mayhem 2026",
    description: "Active tournament with mixed team join policies and sizes",
    startDate: new Date("2026-04-15").toISOString(),
    endDate: new Date("2026-09-15").toISOString(),
    teamMinSize: 3,
    teamMaxSize: 5,
    createdBy: (await getOrCreateSeedAdmin(ctx))._id,
    scoringConfig: {
      individualPoints: { base: 2, advanced: 3 },
      teamExercisePoints: { base: 20, advanced: 30 },
      teamExerciseThreshold: 0.5,
    },
  });
  const modeCycle: TeamSeedMode[] = ["full", "partial", "captainsOnly"];
  let teamsCreated = 0;
  for (let i = 0; i < teamsData.length; i++) {
    const teamData = teamsData[i];
    const captainUser = await getOrCreateUser(ctx, {
      name: teamData.captain.name,
      email: teamData.captain.email,
    });
    const joinPolicy = i % 2 === 0 ? "open" : "closed";
    const mode = modeCycle[i % modeCycle.length];
    const teamId = await ctx.db.insert("teams", {
      name: teamData.name,
      tournamentId,
      createdBy: captainUser._id,
      joinPolicy,
      maxMembers: 5,
      points: 0,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: captainUser._id,
      role: "captain",
    });
    if (mode !== "captainsOnly") {
      const membersToAdd =
        mode === "partial"
          ? teamData.members.slice(0, Math.ceil(teamData.members.length / 2))
          : teamData.members;
      for (const memberData of membersToAdd) {
        const memberUser = await getOrCreateUser(ctx, {
          name: memberData.name,
          email: memberData.email,
        });
        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberUser._id,
          role: "member",
        });
      }
    }
    teamsCreated++;
  }
  return { tournamentId, teamsCreated };
}

async function runSeedJoinRequests(ctx: MutationCtx) {
  const tournament = await ctx.db
    .query("tournaments")
    .withIndex("by_name", (q) =>
      q.eq("name", "Urban Legends Captains Cup 2026"),
    )
    .first();
  if (!tournament) return { skipped: true, reason: "captains cup not found" };

  const teams = await ctx.db
    .query("teams")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
    .collect();
  if (teams.length === 0) return { skipped: true, reason: "no teams" };

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

  const states: Array<{
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
  for (let i = 0; i < states.length; i++) {
    const team = teams[i % teams.length];
    const requester = requesterPool[i % requesterPool.length];
    const requesterUser = await getOrCreateUser(ctx, requester);
    const config = states[i];
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

async function runSeedNotifications(ctx: MutationCtx) {
  const admin = await getOrCreateSeedAdmin(ctx);
  const oneHour = 60 * 60 * 1000;
  const notifications = [
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
  return { notificationsCreated: created };
}

/**
 * Clear all seeded data (teams, team members, and users with seed_ externalId prefix).
 * Tournament must be specified by name. Admin only.
 */
export const clearSeededData = internalMutation({
  args: {
    tournamentName: v.string(),
  },
  handler: async (ctx, args) => {
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

    let deletedTeamMembers = 0;
    let deletedSubmissions = 0;

    for (const team of teams) {
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      for (const member of teamMembers) {
        await ctx.db.delete(member._id);
        deletedTeamMembers++;
      }

      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      for (const submission of submissions) {
        await ctx.db.delete(submission._id);
        deletedSubmissions++;
      }

      await ctx.db.delete(team._id);
    }

    const allUsers = await ctx.db.query("users").collect();
    let deletedUsers = 0;

    for (const userDoc of allUsers) {
      if (userDoc.externalId.startsWith("seed_")) {
        const userRoles = await ctx.db
          .query("userRoles")
          .withIndex("by_user", (q) => q.eq("userId", userDoc._id))
          .collect();

        for (const userRole of userRoles) {
          await ctx.db.delete(userRole._id);
        }

        await ctx.db.delete(userDoc._id);
        deletedUsers++;
      }
    }

    await ctx.db.delete(tournament._id);

    return {
      tournamentDeleted: args.tournamentName,
      teamsDeleted: teams.length,
      teamMembersDeleted: deletedTeamMembers,
      submissionsDeleted: deletedSubmissions,
      usersDeleted: deletedUsers,
    };
  },
});

/**
 * Internal mutation to seed the roles table with system roles.
 * This should be run once to initialize the roles in the database.
 *
 * Roles:
 * - admin: Full system access
 * - player: Basic user access (default role for all users)
 * - tournament_manager: Can create and manage tournaments
 * - reviewer: Can review submissions and moderate content
 * - viewer: Read-only access to analytics
 */
export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const createdRoles = [];

    for (const roleData of rolesToCreate) {
      const existingRole = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", roleData.name))
        .first();

      if (!existingRole) {
        const roleId = await ctx.db.insert("roles", roleData);
        createdRoles.push({ id: roleId, ...roleData, created: true });
      } else {
        await ctx.db.patch(existingRole._id, {
          displayName: roleData.displayName,
          description: roleData.description,
          hierarchy: roleData.hierarchy,
        });
        createdRoles.push({ id: existingRole._id, ...roleData, updated: true });
      }
    }

    return {
      success: true,
      roles: createdRoles,
    };
  },
});
