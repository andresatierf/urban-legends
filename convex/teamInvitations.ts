// Thin pass-through shell; delegates to the joinRequests lifecycle module.
// Public query/mutation names are preserved so the frontend keeps working.
// IDs are now joinRequests IDs; frontend migration is a follow-up PRD.

import { v } from "convex/values";

import { mutation } from "./_generated/server";
import {
  canAcceptJoinRequest,
  canCancelJoinRequest,
  canInviteToTeam,
  canRejectJoinRequest,
} from "./authority/core";
import { accept, cancel, invite, reject } from "./lifecycle/joinRequests";
import {
  notifyJoinRequestApproved,
  notifyJoinRequestRejected,
  notifyMemberJoined,
  notifyTeamInvitation,
} from "./notifications/triggers";
import { getCurrentUserOrThrow } from "./users";

export const inviteMember = mutation({
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

    const requestId = await invite(ctx, {
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

export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await canCancelJoinRequest.require(ctx, user._id, {
      requestId: args.invitationId,
    });

    await cancel(ctx, args.invitationId, user._id);
  },
});

export const respondToInvitation = mutation({
  args: {
    invitationId: v.id("joinRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const req = await ctx.db.get(args.invitationId);
    if (!req) throw new Error("Invitation not found");

    if (args.accept) {
      await canAcceptJoinRequest.require(ctx, user._id, {
        requestId: args.invitationId,
      });

      await accept(ctx, args.invitationId, user._id);

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
    } else {
      await canRejectJoinRequest.require(ctx, user._id, {
        requestId: args.invitationId,
      });

      await reject(ctx, args.invitationId, user._id);

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
