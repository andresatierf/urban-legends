import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  canAcceptJoinRequest,
  canCancelJoinRequest,
  canCreateJoinRequest,
  canInviteToTeam,
  canRejectJoinRequest,
} from "./authority/core";
import { enrichWithRelations } from "./lib/helpers";
import {
  accept as lifecycleAccept,
  cancel as lifecycleCancel,
  invite as lifecycleInvite,
  reject as lifecycleReject,
  request as lifecycleRequest,
} from "./lifecycle/joinRequests";
import {
  notifyJoinRequest,
  notifyJoinRequestApproved,
  notifyJoinRequestRejected,
  notifyMemberJoined,
  notifyTeamInvitation,
} from "./notifications/triggers";
import { getCurrentUserOrThrow } from "./users";

export const list = query({
  args: {
    teamId: v.optional(v.id("teams")),
    userId: v.optional(v.id("users")),
    initiator: v.optional(v.union(v.literal("user"), v.literal("team"))),
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

    const hasTeam = args.teamId !== undefined;
    const hasUser = args.userId !== undefined;
    if (hasTeam === hasUser) {
      throw new Error(
        "list requires exactly one of teamId or userId, not both and not neither",
      );
    }

    let requests = hasTeam
      ? await ctx.db
          .query("joinRequests")
          .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
          .collect()
      : await ctx.db
          .query("joinRequests")
          .withIndex("by_user", (q) => q.eq("userId", args.userId!))
          .collect();

    if (args.initiator) {
      requests = requests.filter((r) => r.initiator === args.initiator);
    }
    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }

    const enriched = await enrichWithRelations(ctx, requests, {
      user: { table: "users", foreignKey: (r) => r.userId },
      team: {
        table: "teams",
        foreignKey: (r) => r.teamId,
        enrich: {
          tournament: {
            table: "tournaments",
            foreignKey: (t) => t.tournamentId,
          },
        },
      },
      invitedByUser: { table: "users", foreignKey: (r) => r.createdBy },
    });

    return enriched.map((r) => ({
      ...r,
      tournament: r.team?.tournament ?? null,
      // Spec: invitedByUser is null when the user initiated the request.
      invitedByUser: r.initiator === "team" ? r.invitedByUser : null,
    }));
  },
});

export const request = mutation({
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

    const requestId = await lifecycleRequest(ctx, {
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

export const invite = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    await canInviteToTeam.require(ctx, user._id, { teamId: args.teamId });

    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!invitedUser) throw new Error("User not found with this email");

    const requestId = await lifecycleInvite(ctx, {
      teamId: args.teamId,
      userId: invitedUser._id,
      createdBy: user._id,
    });

    await notifyTeamInvitation(ctx, {
      invitedUserId: invitedUser._id,
      teamId: args.teamId,
      teamName: team.name,
      inviterName: user.name || user.email,
      invitationId: requestId,
    });

    return requestId;
  },
});

export const accept = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Join request not found");

    await canAcceptJoinRequest.require(ctx, user._id, {
      requestId: args.requestId,
    });

    await lifecycleAccept(ctx, args.requestId, user._id);

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
      const newMember = await ctx.db.get(req.userId);
      if (newMember) {
        await notifyMemberJoined(ctx, {
          recipientIds: existingMemberIds,
          teamId: req.teamId,
          teamName: team.name,
          newMemberName: newMember.name || newMember.email,
        });
      }
    }
  },
});

export const reject = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Join request not found");

    await canRejectJoinRequest.require(ctx, user._id, {
      requestId: args.requestId,
    });

    await lifecycleReject(ctx, args.requestId, user._id);

    const team = await ctx.db.get(req.teamId);
    if (team) {
      await notifyJoinRequestRejected(ctx, {
        userId: req.userId,
        teamId: req.teamId,
        teamName: team.name,
      });
    }
  },
});

export const cancel = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canCancelJoinRequest.require(ctx, user._id, {
      requestId: args.requestId,
    });

    await lifecycleCancel(ctx, args.requestId, user._id);
  },
});
