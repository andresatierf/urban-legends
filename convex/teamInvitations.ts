import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateIsTeamMember, validateTeamHasSpace } from "./teams";
import { validateUserNotInTournamentTeam } from "./tournaments";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

// List team invitations (captain/admin only)
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
    const user = await getCurrentUserOrThrow(ctx);

    validateIsAdmin(user);
    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: user._id,
      captain: true,
    });

    // Get invitations
    let invitationsQuery = ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId));

    if (args.status) {
      invitationsQuery = invitationsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const invitations = await invitationsQuery.collect();

    // Fetch invited user details for each invitation
    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const invitedUser = await ctx.db.get(invitation.invitedUserId);
        const invitedByUser = await ctx.db.get(invitation.invitedBy);

        return {
          ...invitation,
          invitedUser,
          invitedByUser,
        };
      }),
    );

    return invitationsWithDetails;
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
    let invitationsQuery = ctx.db
      .query("teamInvitations")
      .withIndex("by_user", (q) => q.eq("invitedUserId", user._id));

    if (args.status) {
      invitationsQuery = invitationsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const invitations = await invitationsQuery.collect();

    // Fetch team and tournament details for each invitation
    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const [team, invitedBy] = await Promise.all([
          ctx.db.get(invitation.teamId),
          ctx.db.get(invitation.invitedBy),
        ]);

        const tournament = team ? await ctx.db.get(team.tournamentId) : null;
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

// Invite a member to the team (captain or admin only)
export const inviteMember = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await validateTeamHasSpace(ctx, { teamId: args.teamId });

    await validateIsTeamMember(ctx, {
      userId: user._id,
      teamId: args.teamId,
      captain: true,
    });

    // Look up user by email
    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!invitedUser) {
      throw new Error("User not found with this email");
    }

    await validateIsTeamMember(ctx, {
      teamId: args.teamId,
      userId: invitedUser._id,
      invert: true,
    });

    // Check if user already has pending invitation
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

// Cancel an invitation (captain/admin only)
export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    // Validate user is captain/admin
    validateIsAdmin(user);
    await validateIsTeamMember(ctx, {
      teamId: invitation.teamId,
      userId: user._id,
      captain: true,
    });

    // Update invitation status
    await ctx.db.patch(args.invitationId, {
      status: "cancelled",
      respondedAt: new Date().toISOString(),
    });
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
      const team = await validateTeamHasSpace(ctx, {
        teamId: invitation.teamId,
      });

      await validateUserNotInTournamentTeam(ctx, {
        userId: user._id,
        tournamentId: team.tournamentId,
      });

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
