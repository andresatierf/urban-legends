import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { nowUTC } from "./lib/dates";
import { enrichWithRelations } from "./lib/helpers";
import { validateIsTeamMember, validateTeamHasSpace } from "./teams";
import { validateUserNotInTournamentTeam } from "./tournaments";
import { getCurrentUserOrThrow } from "./users";

export const listTeamInvitations = query({
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

    let invitationsQuery = ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId));

    if (args.status) {
      invitationsQuery = invitationsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const invitations = await invitationsQuery.collect();

    return await enrichWithRelations(ctx, invitations, {
      invitedUser: {
        table: "users",
        foreignKey: (inv) => inv.invitedUserId,
      },
      invitedByUser: {
        table: "users",
        foreignKey: (inv) => inv.invitedBy,
      },
    });
  },
});

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

    let invitationsQuery = ctx.db
      .query("teamInvitations")
      .withIndex("by_user", (q) => q.eq("invitedUserId", user._id));

    if (args.status) {
      invitationsQuery = invitationsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const invitations = await invitationsQuery.collect();

    const enriched = await enrichWithRelations(ctx, invitations, {
      team: {
        table: "teams",
        foreignKey: (inv) => inv.teamId,
      },
      invitedByUser: {
        table: "users",
        foreignKey: (inv) => inv.invitedBy,
      },
    });

    return await Promise.all(
      enriched.map(async (inv) => ({
        ...inv,
        tournament: inv.team
          ? await ctx.db.get((inv.team as Doc<"teams">).tournamentId)
          : null,
      })),
    );
  },
});

export const inviteMember = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const team = await validateTeamHasSpace(ctx, { teamId: args.teamId });

    await validateIsTeamMember(ctx, {
      userId: user._id,
      teamId: args.teamId,
      captain: true,
    });

    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!invitedUser) {
      throw new Error("User not found with this email");
    }

    await validateUserNotInTournamentTeam(ctx, {
      userId: invitedUser._id,
      tournamentId: team.tournamentId,
    });

    const existingInvitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team_and_user_and_status", (q) =>
        q
          .eq("teamId", args.teamId)
          .eq("invitedUserId", invitedUser._id)
          .eq("status", "pending"),
      )
      .first();

    if (existingInvitation) {
      throw new Error("User already has a pending invitation to this team");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitationId = await ctx.db.insert("teamInvitations", {
      teamId: args.teamId,
      invitedUserId: invitedUser._id,
      invitedEmail: args.email,
      invitedBy: user._id,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: nowUTC(),
    });

    return invitationId;
  },
});

export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    await validateIsTeamMember(ctx, {
      teamId: invitation.teamId,
      userId: user._id,
      captain: true,
    });

    await ctx.db.patch(args.invitationId, {
      status: "cancelled",
      respondedAt: nowUTC(),
    });
  },
});

export const respondToInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.invitedUserId !== user._id) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

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
      const team = await validateTeamHasSpace(ctx, {
        teamId: invitation.teamId,
      });

      await validateUserNotInTournamentTeam(ctx, {
        userId: user._id,
        tournamentId: team.tournamentId,
      });

      await ctx.db.insert("teamMembers", {
        teamId: invitation.teamId,
        userId: user._id,
        role: "member",
      });

      await ctx.db.patch(args.invitationId, {
        status: "accepted",
        respondedAt: nowUTC(),
      });

      const otherInvitations = await ctx.db
        .query("teamInvitations")
        .withIndex("by_user_and_status", (q) =>
          q.eq("invitedUserId", user._id).eq("status", "pending"),
        )
        .filter((q) => q.neq(q.field("_id"), args.invitationId))
        .collect();

      for (const inv of otherInvitations) {
        const invTeam = await ctx.db.get(inv.teamId);
        if (invTeam && invTeam.tournamentId === team.tournamentId) {
          await ctx.db.patch(inv._id, {
            status: "cancelled",
            respondedAt: nowUTC(),
          });
        }
      }
    } else {
      await ctx.db.patch(args.invitationId, {
        status: "rejected",
        respondedAt: nowUTC(),
      });
    }
  },
});
