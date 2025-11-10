import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateIsTeamMember, validateTeamHasSpace } from "./teams";
import { validateUserNotInTournamentTeam } from "./tournaments";
import { getCurrentUserOrThrow } from "./users";

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
    await getCurrentUserOrThrow(ctx);

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

// Get user's join request for a specific team
export const getUserJoinRequest = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const request = await ctx.db
      .query("joinRequests")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    return request;
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

    const team = await validateTeamHasSpace(ctx, { teamId: args.teamId });

    // Check if team is public
    if (team.visibility !== "public") {
      throw new Error("Cannot request to join a private team");
    }

    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      invert: true,
    });
    await validateUserNotInTournamentTeam(ctx, {
      userId: user._id,
      tournamentId: team.tournamentId,
    });

    // Check if user already has a pending request
    const pendingRequest = await ctx.db
      .query("joinRequests")
      .withIndex("by_team_and_user_and_status", (q) =>
        q
          .eq("teamId", args.teamId)
          .eq("userId", user._id)
          .eq("status", "pending"),
      )
      .first();

    if (pendingRequest) {
      throw new Error("You already have a pending join request for this team");
    }

    // Check if user was previously rejected
    const rejectedRequest = await ctx.db
      .query("joinRequests")
      .withIndex("by_team_and_user_and_status", (q) =>
        q
          .eq("teamId", args.teamId)
          .eq("userId", user._id)
          .eq("status", "rejected"),
      )
      .first();

    if (rejectedRequest) {
      throw new Error(
        "Your join request was rejected. You cannot request to join this team again",
      );
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

// Approve a join request (captain or admin only)
export const respondToJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
    approve: v.boolean(),
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

    await validateIsTeamMember(ctx, {
      teamId: request.teamId,
      userId: user._id,
      captain: true,
    });

    if (args.approve) {
      const team = await validateTeamHasSpace(ctx, { teamId: request.teamId });

      await validateUserNotInTournamentTeam(ctx, {
        userId: request.userId,
        tournamentId: team.tournamentId,
      });

      await ctx.db.insert("teamMembers", {
        teamId: request.teamId,
        userId: request.userId,
        role: "member",
      });

      await ctx.db.patch(args.requestId, {
        status: "approved",
        respondedAt: new Date().toISOString(),
        respondedBy: user._id,
      });
    } else {
      await ctx.db.patch(args.requestId, {
        status: "rejected",
        respondedAt: new Date().toISOString(),
        respondedBy: user._id,
      });
    }
  },
});
