import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { nowUTC } from "./lib/dates";
import { enrichWithRelations } from "./lib/helpers";
import {
  notifyJoinRequest,
  notifyJoinRequestApproved,
  notifyJoinRequestRejected,
  notifyMemberJoined,
} from "./notifications/triggers";
import { validateIsTeamMember, validateTeamHasSpace } from "./teams";
import { validateUserNotInTournamentTeam } from "./tournaments";
import { getCurrentUserOrThrow } from "./users";

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

    let requests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }

    return await enrichWithRelations(ctx, requests, {
      user: { table: "users", foreignKey: (request) => request.userId },
    });
  },
});

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

export const requestToJoin = mutation({
  args: {
    teamId: v.id("teams"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const team = await validateTeamHasSpace(ctx, { teamId: args.teamId });

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

    const requestId = await ctx.db.insert("joinRequests", {
      teamId: args.teamId,
      userId: user._id,
      status: "pending",
      message: args.message,
      createdAt: nowUTC(),
    });

    // T020: Notify team captain about join request
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const captain = teamMembers.find((m) => m.role === "captain");
    if (captain) {
      await notifyJoinRequest(ctx, {
        captainId: captain.userId,
        teamId: args.teamId,
        teamName: team.name,
        requesterName: user.name || user.email,
        requestId,
      });
    }

    return requestId;
  },
});

export const cancelJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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

    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      respondedAt: nowUTC(),
    });
  },
});

export const respondToJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
    approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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
        respondedAt: nowUTC(),
        respondedBy: user._id,
      });

      // T021: Notify user that their join request was approved
      await notifyJoinRequestApproved(ctx, {
        userId: request.userId,
        teamId: request.teamId,
        teamName: team.name,
      });

      // T023: Notify existing team members that someone joined
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", request.teamId))
        .collect();

      const existingMemberIds = teamMembers
        .map((m) => m.userId)
        .filter((id) => id !== request.userId);

      if (existingMemberIds.length > 0) {
        const requestingUser = await ctx.db.get(request.userId);
        if (requestingUser) {
          await notifyMemberJoined(ctx, {
            recipientIds: existingMemberIds,
            teamId: request.teamId,
            teamName: team.name,
            newMemberName: requestingUser.name || requestingUser.email,
          });
        }
      }
    } else {
      await ctx.db.patch(args.requestId, {
        status: "rejected",
        respondedAt: nowUTC(),
        respondedBy: user._id,
      });

      // T022: Notify user that their join request was rejected
      const team = await ctx.db.get(request.teamId);
      if (team) {
        await notifyJoinRequestRejected(ctx, {
          userId: request.userId,
          teamId: request.teamId,
          teamName: team.name,
        });
      }
    }
  },
});
