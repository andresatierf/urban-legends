import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

/**
 * Get the count of pending actions for the captain's teams.
 * This includes:
 * - Pending join requests across all teams the user captains
 * - Pending invitations sent by the user
 */
export const getPendingActionsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get all teams user captains
    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeams.map((tm) => tm.teamId);

    // If user doesn't captain any teams, return 0
    if (teamIds.length === 0) {
      return 0;
    }

    // Count pending join requests for all teams the user captains
    const joinRequests = await ctx.db
      .query("joinRequests")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Filter join requests to only those for captain's teams
    const relevantJoinRequests = joinRequests.filter((jr) =>
      teamIds.includes(jr.teamId),
    );

    // Count pending invitations sent by the user
    const allPendingInvitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const invitations = allPendingInvitations.filter(
      (inv) => inv.invitedBy === user._id,
    );

    return relevantJoinRequests.length + invitations.length;
  },
});
