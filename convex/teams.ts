import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { validateUserNotInTournamentTeam } from "./tournaments";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.userId && !args.tournamentId)
      return await ctx.db.query("teams").collect();

    let query = ctx.db.query("teams");

    if (args.userId) {
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) =>
          q.eq("userId", args.userId as typeof args.userId),
        )
        .collect();

      const teamIds = memberships.map((m) => m.teamId);

      query = query.filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
      );
    }

    if (args.tournamentId) {
      query = query.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
    }

    return await query.collect();
  },
});

export const listMembers = query({
  args: { teamIds: v.union(v.id("teams"), v.array(v.id("teams"))) },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!Array.isArray(args.teamIds)) {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) =>
          q.eq("teamId", args.teamIds as unknown as Id<"teams">),
        )
        .collect();
    }

    const teamMembersPerTeam = await Promise.all(
      args.teamIds.map((id) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", id))
          .collect(),
      ),
    );

    return teamMembersPerTeam.flat();
  },
});

export const get = query({
  args: {
    userId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.teamId && !args.teamName && !args.userId && !args.tournamentId)
      throw new Error(
        "Must provide either team id, team name and tournament id, or user and tournament ids",
      );

    if (
      (args.teamId && (args.teamName || args.userId || args.tournamentId)) ||
      (args.teamName && (args.userId || !args.tournamentId)) ||
      (args.userId && !args.tournamentId) ||
      (args.tournamentId && !args.teamName && !args.userId)
    )
      throw new Error(
        "Must provide either team id, team name and tournament id, or user and tournament ids",
      );

    if (args.teamId) return await ctx.db.get(args.teamId);

    if (args.teamName && args.tournamentId)
      return await ctx.db
        .query("teams")
        .withIndex("by_tournament_and_name", (q) =>
          q
            .eq("tournamentId", args.tournamentId as typeof args.tournamentId)
            .eq("name", args.teamName as typeof args.teamName),
        )
        .unique();

    if (args.userId && args.tournamentId) {
      const userTeams = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) =>
          q.eq("userId", args.userId as typeof args.userId),
        )
        .collect();
      const teamIds = userTeams.map((m) => m.teamId);
      return await ctx.db
        .query("teams")
        .filter((q) =>
          q.and(
            q.eq(q.field("tournamentId"), args.tournamentId),
            q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
          ),
        )
        .unique();
    }

    throw new Error("This should never happen");
  },
});

export const removeUserTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      captain: true,
    });

    const submissions = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();

    const invitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    await Promise.all(
      [
        submissions.map(({ _id }) => ctx.db.delete(_id)),
        invitations.map(({ _id }) => ctx.db.delete(_id)),
        joinRequests.map(({ _id }) => ctx.db.delete(_id)),
        teamMembers.map(({ _id }) => ctx.db.delete(_id)),
      ].flat(),
    );

    return await ctx.db.delete(args.teamId);
  },
});

export const getUserTeamByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const userTeam = await ctx.db
      .query("teamMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.or(...teams.map(({ _id }) => q.eq(q.field("teamId"), _id))),
        ),
      )
      .first();

    return teams.find(({ _id }) => userTeam?.teamId === _id);
  },
});

export const listTeamMembers = query({
  args: { teamId: v.id("teams"), excludeSelf: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          ...teamMembers.map((member) => q.eq(q.field("_id"), member.userId)),
        ),
      )
      .collect();

    return users
      .filter((u) => !args.excludeSelf || u._id !== user._id)
      .map((u) => ({
        ...u,
        role: teamMembers.find((m) => m.userId === u._id)?.role,
      }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
    members: v.array(v.id("users")),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(user);

    await validateUniqueTeamName(ctx, {
      tournamentId: args.tournamentId,
      name: args.name,
    });

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const team = await ctx.db.insert("teams", {
      name: args.name,
      tournamentId: args.tournamentId,
      createdBy: user._id,
      visibility: args.visibility ?? "public",
      maxMembers: tournament.teamMaxSize,
      points: 0,
    });

    // TODO: add members if provided

    return team;
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    userEmail: v.string(),
    role: v.union(v.literal("member"), v.literal("captain")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(user);

    // Find user by email
    const userToAdd = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!userToAdd) {
      throw new Error("User not found");
    }

    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: userToAdd._id,
      invert: true,
    });

    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: userToAdd._id,
      role: args.role,
    });
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      captain: true,
    });
    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: args.userId,
    });

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId),
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

type GetTeamsArgs = { userId?: Id<"users">; tournamentId?: Id<"tournaments"> };

export async function getTeams(
  ctx: QueryCtx,
  { userId, tournamentId }: GetTeamsArgs,
) {
  if (!userId && !tournamentId) return await ctx.db.query("teams").collect();

  const filter: { teamIds: Id<"teams">[]; tournamentId?: Id<"tournaments"> } = {
    teamIds: [],
  };

  if (userId) {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    filter.teamIds.push(...memberships.map((m) => m.teamId));
  }

  if (tournamentId) {
    filter.tournamentId = tournamentId;
  }

  const teams = await ctx.db
    .query("teams")
    .filter((q) =>
      q.and(
        q.or(...filter.teamIds.map((id) => q.eq(q.field("_id"), id as string))),
        // q.eq(q.field("tournamentId"), filter.tournamentId),
      ),
    )
    .collect();

  return teams;
}

export const upsertUserTeam = mutation({
  args: {
    _id: v.optional(v.id("teams")),
    name: v.string(),
    tournamentId: v.id("tournaments"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const isAdmin = user.roles.includes("admin");

    if (!isAdmin) {
      if (args._id) {
        await validateIsTeamMember(ctx, {
          teamId: args._id,
          userId: user._id,
          captain: true,
        });
      }
    }

    const data = {
      name: args.name,
      tournamentId: args.tournamentId,
      visibility: args.visibility,
    };

    if (args._id) {
      const team = await ctx.db.get(args._id);
      if (!team) {
        throw new Error("Team not found");
      }

      if (args.name !== team.name) {
        await validateUniqueTeamName(ctx, {
          tournamentId: team.tournamentId,
          name: args.name,
        });
      }

      await ctx.db.patch(args._id, data);

      return args._id;
    }

    // Validate tournament exists
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    await validateUserNotInTournamentTeam(ctx, {
      userId: user._id,
      tournamentId: args.tournamentId,
    });

    await validateUniqueTeamName(ctx, {
      tournamentId: args.tournamentId,
      name: args.name,
    });

    const teamId = await ctx.db.insert("teams", {
      ...data,
      createdBy: user._id,
      maxMembers: tournament.teamMaxSize,
      points: 0,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user._id,
      role: "captain",
    });

    return teamId;
  },
});

// Leave a team
export const leaveTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Validate user is in team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Get all team members
    const allMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // If captain and other members exist, must transfer captaincy first
    if (membership.role === "captain" && allMembers.length > 1) {
      throw new Error(
        "As captain, you must transfer captaincy before leaving the team",
      );
    }

    // Remove user from team
    await ctx.db.delete(membership._id);

    // If last member, delete the team
    if (allMembers.length === 1) {
      await ctx.db.delete(args.teamId);
    }
  },
});

// Transfer captaincy to another team member
export const transferCaptaincy = mutation({
  args: {
    teamId: v.id("teams"),
    newCaptainId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const currentCaptainMembership = await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      captain: true,
    });

    const newCaptainMembership = await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: args.newCaptainId,
    });

    // Update both roles
    await ctx.db.patch(currentCaptainMembership._id, { role: "member" });
    await ctx.db.patch(newCaptainMembership._id, { role: "captain" });
  },
});

type ValidateIsTeamMemberArgs = {
  userId: Id<"users">;
  teamId: Id<"teams">;
  captain?: boolean;
  invert?: boolean;
};

export async function validateIsTeamMember(
  ctx: QueryCtx,
  args: ValidateIsTeamMemberArgs & { invert: true },
): Promise<null>;
export async function validateIsTeamMember(
  ctx: QueryCtx,
  args: ValidateIsTeamMemberArgs & { invert?: false },
): Promise<Doc<"teamMembers">>;
export async function validateIsTeamMember(
  ctx: QueryCtx,
  args: ValidateIsTeamMemberArgs,
): Promise<Doc<"teamMembers"> | null> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", args.teamId).eq("userId", args.userId),
    )
    .first();

  if (args.invert && args.captain) {
    throw new Error("Can't invert and check for captain at the same time");
  }

  if (!args.invert && !membership) {
    throw new Error("Team membership required");
  }

  if (args.invert && membership) {
    throw new Error("User already part of team");
  }

  if (args.captain && membership?.role !== "captain") {
    throw new Error("Captain access required");
  }

  return membership;
}

type ValidateUniqueTeamNameArgs = {
  tournamentId: Id<"tournaments">;
  name: string;
};

async function validateUniqueTeamName(
  ctx: QueryCtx,
  args: ValidateUniqueTeamNameArgs,
) {
  // Validate team name uniqueness within tournament
  const existingTeamName = await ctx.db
    .query("teams")
    .withIndex("by_tournament_and_name", (q) =>
      q.eq("tournamentId", args.tournamentId).eq("name", args.name),
    )
    .first();

  if (existingTeamName) {
    throw new Error("Team name already exists in this tournament");
  }
}

type ValidateTeamHasSpaceArgs = {
  teamId: Id<"teams">;
};

export async function validateTeamHasSpace(
  ctx: QueryCtx,
  args: ValidateTeamHasSpaceArgs,
) {
  // Get team
  const team = await ctx.db.get(args.teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  // Check team still has space
  const currentMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  if (team.maxMembers && currentMembers.length >= team.maxMembers) {
    throw new Error("Team is full");
  }

  return team;
}

// Admin utility to recalculate team points from approved submissions
export const recalculatePoints = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Get tournament for scoring config
    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const scoringConfig = tournament.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    // Get all team members for participation calculation
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get all approved submissions for team
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("state"), "approved"))
      .collect();

    let totalPoints = 0;
    let updatedCount = 0;

    // Calculate points for each submission
    for (const submission of submissions) {
      let pointsEarned = submission.pointsEarned;

      const tier = submission.tier || "base";
      const totalTeamMembers = teamMembers.length;
      const participantCount = Math.min(
        totalTeamMembers,
        submission.teammates.length + 1,
      );
      const participationRate =
        totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
      const isTeamExercise =
        participationRate >= scoringConfig.teamExerciseThreshold;

      pointsEarned = isTeamExercise
        ? scoringConfig.teamExercisePoints[tier]
        : scoringConfig.individualPoints[tier];

      // Update the submission with calculated points
      await ctx.db.patch(submission._id, { pointsEarned });
      updatedCount++;

      totalPoints += pointsEarned;
    }

    // Find most recent submission for lastActivityAt
    const sortedSubmissions = submissions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const lastActivityAt = sortedSubmissions[0]?.date;

    // Update team points
    await ctx.db.patch(args.teamId, {
      points: totalPoints,
      lastActivityAt,
    });

    return {
      teamId: args.teamId,
      points: totalPoints,
      lastActivityAt,
      submissionsUpdated: updatedCount,
    };
  },
});

// Get detailed statistics for a team
export const getStatistics = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) return null;

    // Get all submissions for the team
    const allSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const approvedSubmissions = allSubmissions.filter(
      (s) => s.state === "approved",
    );

    // Calculate tournament duration and expected days
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const today = new Date();
    const currentDate = today > endDate ? endDate : today;

    const tournamentDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const daysSoFar =
      today < startDate
        ? 0
        : Math.ceil(
            (currentDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;

    // Calculate approval rate
    const approvalRate =
      allSubmissions.length > 0
        ? approvedSubmissions.length / allSubmissions.length
        : 0;

    // Calculate average points per day
    const averagePointsPerDay = daysSoFar > 0 ? team.points / daysSoFar : 0;

    // Calculate current streak (consecutive days with approved submissions)
    const approvedDates = new Set(
      approvedSubmissions
        .map((s) => s.date)
        .sort()
        .reverse(),
    );
    let currentStreak = 0;
    const streakDate = new Date(today);
    streakDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = streakDate.toISOString().split("T")[0];
      if (approvedDates.has(dateStr)) {
        currentStreak++;
        streakDate.setDate(streakDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate member contributions
    const memberContributions = new Map<Id<"users">, number>();
    for (const submission of approvedSubmissions) {
      memberContributions.set(
        submission.userId,
        (memberContributions.get(submission.userId) || 0) + 1,
      );
    }

    const memberContributionsArray = Array.from(
      memberContributions.entries(),
    ).map(([userId, count]) => ({ userId, count }));

    // Calculate completion rate
    const uniqueSubmissionDays = new Set(approvedSubmissions.map((s) => s.date))
      .size;
    const completionRate = daysSoFar > 0 ? uniqueSubmissionDays / daysSoFar : 0;

    return {
      totalSubmissions: allSubmissions.length,
      approvedSubmissions: approvedSubmissions.length,
      approvalRate,
      averagePointsPerDay,
      currentStreak,
      memberContributions: memberContributionsArray,
      completionRate,
      tournamentDays,
      daysSoFar,
    };
  },
});
