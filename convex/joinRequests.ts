import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  canAcceptJoinRequest,
  canCancelJoinRequest,
  canCreateJoinRequest,
  canRejectJoinRequest,
} from "./authority/core";
import { enrichWithRelations } from "./lib/helpers";
import { accept, cancel, reject, request } from "./lifecycle/joinRequests";
import {
  notifyJoinRequest,
  notifyJoinRequestApproved,
  notifyJoinRequestRejected,
  notifyMemberJoined,
} from "./notifications/triggers";
import { getCurrentUserOrThrow } from "./users";

export const listJoinRequests = query({
  args: {
    teamId: v.id("teams"),
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

export const listUserJoinRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    return await ctx.db
      .query("joinRequests")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .collect();
  },
});

export const requestToJoin = mutation({
  args: {
    teamId: v.id("teams"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    if (team.joinPolicy !== "open") {
      throw new Error("Cannot request to join a closed team");
    }

    await canCreateJoinRequest.require(ctx, user._id, { teamId: args.teamId });

    const requestId = await request(ctx, {
      teamId: args.teamId,
      userId: user._id,
      message: args.message,
    });

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

    await canCancelJoinRequest.require(ctx, user._id, {
      requestId: args.requestId,
    });

    await cancel(ctx, args.requestId, user._id);
  },
});

export const respondToJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
    approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const req = await ctx.db.get(args.requestId);
    if (!req) {
      throw new Error("Join request not found");
    }

    if (args.approve) {
      await canAcceptJoinRequest.require(ctx, user._id, {
        requestId: args.requestId,
      });

      await accept(ctx, args.requestId, user._id);

      const team = await ctx.db.get(req.teamId);
      if (!team) throw new Error("Team not found");

      await notifyJoinRequestApproved(ctx, {
        userId: req.userId,
        teamId: req.teamId,
        teamName: team.name,
      });

      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", req.teamId))
        .collect();

      const existingMemberIds = teamMembers
        .map((m) => m.userId)
        .filter((id) => id !== req.userId);

      if (existingMemberIds.length > 0) {
        const requestingUser = await ctx.db.get(req.userId);
        if (requestingUser) {
          await notifyMemberJoined(ctx, {
            recipientIds: existingMemberIds,
            teamId: req.teamId,
            teamName: team.name,
            newMemberName: requestingUser.name || requestingUser.email,
          });
        }
      }
    } else {
      await canRejectJoinRequest.require(ctx, user._id, {
        requestId: args.requestId,
      });

      await reject(ctx, args.requestId, user._id);

      const team = await ctx.db.get(req.teamId);
      if (team) {
        await notifyJoinRequestRejected(ctx, {
          userId: req.userId,
          teamId: req.teamId,
          teamName: team.name,
        });
      }
    }
  },
});
