import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

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
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
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
          q.eq("tournamentId", args.tournamentId!).eq("name", args.teamName!),
        )
        .unique();

    if (args.userId && args.tournamentId) {
      const userTeams = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
      const teamIds = userTeams.map((m) => m.teamId);
      return await ctx.db
        .query("teams")
        .filter((q) =>
          q.and(
            q.eq(q.field("tournamentId"), args.tournamentId!),
            q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
          ),
        )
        .unique();
    }

    throw new Error("This should never happen");
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

    return users.filter((u) => !args.excludeSelf || u._id !== user._id);
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

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_tournament_and_name", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("name", args.name),
      )
      .first();
    if (existingTeam) {
      throw new Error("Team name already exists");
    }

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

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Find user by email
    const userToAdd = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!userToAdd) {
      throw new Error("User not found");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userToAdd._id),
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

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

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

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

// New user-facing team creation
export const createUserTeam = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate tournament exists
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if user already has a team in this tournament
    const userTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const teamIds = userTeams.map((m) => m.teamId);
    const existingTeamInTournament = await ctx.db
      .query("teams")
      .filter((q) =>
        q.and(
          q.eq(q.field("tournamentId"), args.tournamentId),
          q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
        ),
      )
      .first();

    if (existingTeamInTournament) {
      throw new Error("You already have a team in this tournament");
    }

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

    // Create team with user as captain
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      tournamentId: args.tournamentId,
      createdBy: user._id,
      visibility: args.visibility,
      maxMembers: tournament.teamMaxSize,
    });

    // Add user as captain
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user._id,
      role: "captain",
    });

    return teamId;
  },
});

// Request to join a public team
export const requestToJoin = mutation({
  args: {
    teamId: v.id("teams"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if team is public
    if (team.visibility !== "public") {
      throw new Error("Cannot request to join a private team");
    }

    // Check if user already in team
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of this team");
    }

    // Check if user already has a pending request
    const existingRequest = await ctx.db
      .query("joinRequests")
      .withIndex("by_team_and_status", (q) =>
        q.eq("teamId", args.teamId).eq("status", "pending"),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingRequest) {
      throw new Error("You already have a pending join request for this team");
    }

    // Check if user already in a team for this tournament
    const userTeamsInTournament = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const teamIds = userTeamsInTournament.map((m) => m.teamId);
    const teamsInSameTournament = await ctx.db
      .query("teams")
      .filter((q) =>
        q.and(
          q.eq(q.field("tournamentId"), team.tournamentId),
          q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
        ),
      )
      .first();

    if (teamsInSameTournament) {
      throw new Error("You already have a team in this tournament");
    }

    // Check team has space
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (team.maxMembers && currentMembers.length >= team.maxMembers) {
      throw new Error("Team is full");
    }

    // Create join request
    const requestId = await ctx.db.insert("joinRequests", {
      teamId: args.teamId,
      userId: user._id,
      status: "pending",
      message: args.message,
      createdAt: new Date().toISOString(),
    });

    return requestId;
  },
});

// Approve a join request (captain or admin only)
export const approveJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get join request
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Join request is not pending");
    }

    // Get team
    const team = await ctx.db.get(request.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is captain or admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", request.teamId).eq("userId", user._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";
    const isAdmin = user.roles.includes("admin");

    if (!isCaptain && !isAdmin) {
      throw new Error("Only team captain or admin can approve join requests");
    }

    // Check team still has space
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", request.teamId))
      .collect();

    if (team.maxMembers && currentMembers.length >= team.maxMembers) {
      throw new Error("Team is full");
    }

    // Add user to team
    await ctx.db.insert("teamMembers", {
      teamId: request.teamId,
      userId: request.userId,
      role: "member",
    });

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "approved",
      respondedAt: new Date().toISOString(),
      respondedBy: user._id,
    });
  },
});

// Reject a join request (captain or admin only)
export const rejectJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get join request
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Join request is not pending");
    }

    // Check if user is captain or admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", request.teamId).eq("userId", user._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";
    const isAdmin = user.roles.includes("admin");

    if (!isCaptain && !isAdmin) {
      throw new Error("Only team captain or admin can reject join requests");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      respondedAt: new Date().toISOString(),
      respondedBy: user._id,
    });
  },
});

// Cancel a join request (requester only)
export const cancelJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get join request
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.userId !== user._id) {
      throw new Error("You can only cancel your own join requests");
    }

    if (request.status !== "pending") {
      throw new Error("Join request is not pending");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      respondedAt: new Date().toISOString(),
    });
  },
});

// Invite a member to the team (captain or admin only)
export const inviteMember = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is captain or admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";
    const isAdmin = user.roles.includes("admin");

    if (!isCaptain && !isAdmin) {
      throw new Error("Only team captain or admin can invite members");
    }

    // Look up user by email
    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!invitedUser) {
      throw new Error("User not found with this email");
    }

    // Check if user already in team
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", invitedUser._id),
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this team");
    }

    // Check if user already has pending invitation
    const existingInvitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team_and_status", (q) =>
        q.eq("teamId", args.teamId).eq("status", "pending"),
      )
      .filter((q) => q.eq(q.field("invitedUserId"), invitedUser._id))
      .first();

    if (existingInvitation) {
      throw new Error("User already has a pending invitation to this team");
    }

    // Check team has space
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (team.maxMembers && currentMembers.length >= team.maxMembers) {
      throw new Error("Team is full");
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitationId = await ctx.db.insert("teamInvitations", {
      teamId: args.teamId,
      invitedUserId: invitedUser._id,
      invitedEmail: args.email,
      invitedBy: user._id,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return invitationId;
  },
});

// Respond to an invitation (accept or reject)
export const respondToInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Validate invitation belongs to user
    if (invitation.invitedUserId !== user._id) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    // Check if invitation hasn't expired
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    if (now > expiresAt) {
      await ctx.db.patch(args.invitationId, {
        status: "expired",
        respondedAt: now.toISOString(),
      });
      throw new Error("Invitation has expired");
    }

    if (args.accept) {
      // Get team
      const team = await ctx.db.get(invitation.teamId);
      if (!team) {
        throw new Error("Team not found");
      }

      // Check if user already in a team for this tournament
      const userTeamsInTournament = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const teamIds = userTeamsInTournament.map((m) => m.teamId);
      const teamsInSameTournament = await ctx.db
        .query("teams")
        .filter((q) =>
          q.and(
            q.eq(q.field("tournamentId"), team.tournamentId),
            q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
          ),
        )
        .first();

      if (teamsInSameTournament) {
        throw new Error("You already have a team in this tournament");
      }

      // Check team still has space
      const currentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", invitation.teamId))
        .collect();

      if (team.maxMembers && currentMembers.length >= team.maxMembers) {
        throw new Error("Team is full");
      }

      // Add user to team
      await ctx.db.insert("teamMembers", {
        teamId: invitation.teamId,
        userId: user._id,
        role: "member",
      });

      // Update invitation status
      await ctx.db.patch(args.invitationId, {
        status: "accepted",
        respondedAt: new Date().toISOString(),
      });

      // Cancel other pending invitations for this user in the same tournament
      const otherInvitations = await ctx.db
        .query("teamInvitations")
        .withIndex("by_user", (q) => q.eq("invitedUserId", user._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("status"), "pending"),
            q.neq(q.field("_id"), args.invitationId),
          ),
        )
        .collect();

      for (const inv of otherInvitations) {
        const invTeam = await ctx.db.get(inv.teamId);
        if (invTeam && invTeam.tournamentId === team.tournamentId) {
          await ctx.db.patch(inv._id, {
            status: "cancelled",
            respondedAt: new Date().toISOString(),
          });
        }
      }
    } else {
      // Reject invitation
      await ctx.db.patch(args.invitationId, {
        status: "rejected",
        respondedAt: new Date().toISOString(),
      });
    }
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

    // Validate current user is captain
    const currentCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (
      !currentCaptainMembership ||
      currentCaptainMembership.role !== "captain"
    ) {
      throw new Error("Only the team captain can transfer captaincy");
    }

    // Validate new captain is team member
    const newCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.newCaptainId),
      )
      .first();

    if (!newCaptainMembership) {
      throw new Error("New captain must be a team member");
    }

    // Update both roles
    await ctx.db.patch(currentCaptainMembership._id, { role: "member" });
    await ctx.db.patch(newCaptainMembership._id, { role: "captain" });
  },
});

// List join requests for a team
export const listJoinRequests = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is captain or admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";
    const isAdmin = user.roles.includes("admin");

    if (!isCaptain && !isAdmin) {
      throw new Error("Only team captain or admin can view join requests");
    }

    // Get join requests
    let requests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }

    // Fetch user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requestUser = await ctx.db.get(request.userId);
        return {
          ...request,
          user: requestUser,
        };
      }),
    );

    return requestsWithUsers;
  },
});

// List invitations for current user
export const listUserInvitations = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("cancelled"),
        v.literal("expired"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get invitations
    let invitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_user", (q) => q.eq("invitedUserId", user._id))
      .collect();

    if (args.status) {
      invitations = invitations.filter((i) => i.status === args.status);
    }

    // Fetch team and tournament details for each invitation
    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const team = await ctx.db.get(invitation.teamId);
        const tournament = team ? await ctx.db.get(team.tournamentId) : null;
        const invitedBy = await ctx.db.get(invitation.invitedBy);
        return {
          ...invitation,
          team,
          tournament,
          invitedByUser: invitedBy,
        };
      }),
    );

    return invitationsWithDetails;
  },
});

// Get user's join request for a specific team
export const getUserJoinRequest = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const request = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    return request;
  },
});
