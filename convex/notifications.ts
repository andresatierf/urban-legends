import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { isValidNotificationType } from "./notifications/types";
import { getCurrentUserOrThrow } from "./users";

/**
 * Query: List user's notifications with filtering and pagination
 */
export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filter: v.optional(
      v.union(v.literal("all"), v.literal("unread"), v.literal("read")),
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Authorization: users can only view their own notifications
    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;

    const notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("isDeleted"), true));

    // Apply read/unread filter if specified
    const allNotifications = await notificationsQuery.collect();

    let filtered = allNotifications;
    if (args.filter === "unread") {
      filtered = allNotifications.filter((n) => !n.isRead);
    } else if (args.filter === "read") {
      filtered = allNotifications.filter((n) => n.isRead);
    }

    // Sort by createdAt descending (most recent first)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  },
});

/**
 * Query: Get unread notification count
 */
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false),
      )
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    return unread.length;
  },
});

/**
 * Query: Get recent notifications (for dropdown)
 */
export const recent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const limit = Math.min(args.limit ?? 5, 10);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Sort by createdAt descending
    notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return notifications.slice(0, limit);
  },
});

/**
 * Query: Get single notification by ID
 */
export const get = query({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) return null;
    if (notification.userId !== currentUser._id) return null;
    if (notification.isDeleted) return null;

    return notification;
  },
});

/**
 * Internal Mutation: Create notification (idempotent)
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    actionMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validate notification type
    if (!isValidNotificationType(args.type)) {
      throw new Error(`Invalid notification type: ${args.type}`);
    }

    // Validate title length
    if (args.title.length > 200) {
      throw new Error("Notification title must be 200 characters or less");
    }

    // Validate body length
    if (args.body && args.body.length > 1000) {
      throw new Error("Notification body must be 1000 characters or less");
    }

    // Check for existing notification (idempotency)
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user_type_entity", (q) =>
        q
          .eq("userId", args.userId)
          .eq("type", args.type)
          .eq("relatedEntityType", args.relatedEntityType ?? undefined)
          .eq("relatedEntityId", args.relatedEntityId ?? undefined),
      )
      .first();

    // Only treat non-deleted notifications as candidates for idempotency
    if (existing && !existing.isDeleted) {
      return existing._id; // Idempotent: return existing
    }

    // Create new notification
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      relatedEntityId: args.relatedEntityId,
      relatedEntityType: args.relatedEntityType,
      actionUrl: args.actionUrl,
      actionMetadata: args.actionMetadata,
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Mutation: Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== currentUser._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });

    return { success: true };
  },
});

/**
 * Mutation: Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false),
      )
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true }),
      ),
    );

    return { updatedCount: unread.length };
  },
});

/**
 * Mutation: Soft delete notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== currentUser._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, { isDeleted: true });

    return { success: true };
  },
});

/**
 * Internal Mutation: Cleanup old notifications (90-day retention)
 */
export const cleanupOldNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    const batchSize = 100;
    let totalDeleted = 0;

    while (true) {
      const oldNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_createdAt")
        .filter((q) =>
          q.and(
            q.lt(q.field("createdAt"), cutoffIso),
            q.neq(q.field("isDeleted"), true),
          ),
        )
        .take(batchSize);

      if (oldNotifications.length === 0) break;

      await Promise.all(
        oldNotifications.map((notification) =>
          ctx.db.patch(notification._id, { isDeleted: true }),
        ),
      );

      totalDeleted += oldNotifications.length;

      if (oldNotifications.length < batchSize) break;
    }

    console.log(
      `Cleaned up ${totalDeleted} notifications older than ${retentionDays} days`,
    );

    return { deletedCount: totalDeleted };
  },
});

/**
 * Internal Mutation: Check for tournaments starting in 24 hours
 */
export const checkTournament24hWarnings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const allTournaments = await ctx.db.query("tournaments").collect();

    const tournamentsStartingSoon = allTournaments.filter((tournament) => {
      const startDate = new Date(tournament.startDate);
      return startDate >= windowStart && startDate <= windowEnd;
    });

    let notificationsSent = 0;

    for (const tournament of tournamentsStartingSoon) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      const teamMemberPromises = teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamMembers = teamMembersNested.flat();

      const userIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

      for (const userId of userIds) {
        // Check for existing notification (idempotency)
        const existing = await ctx.db
          .query("notifications")
          .withIndex("by_user_type_entity", (q) =>
            q
              .eq("userId", userId)
              .eq("type", "tournament_starting_24h")
              .eq("relatedEntityType", "tournament")
              .eq(
                "relatedEntityId",
                `${tournament._id}_${tournament.startDate}`,
              ),
          )
          .first();

        if (!existing) {
          await ctx.db.insert("notifications", {
            userId,
            type: "tournament_starting_24h",
            title: `${tournament.name} starts in 24 hours`,
            body: "Get ready! The tournament begins tomorrow.",
            relatedEntityId: `${tournament._id}_${tournament.startDate}`,
            relatedEntityType: "tournament",
            actionUrl: `/tournaments/${tournament._id}`,
            isRead: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          });
          notificationsSent++;
        }
      }
    }

    console.log(
      `Sent ${notificationsSent} tournament 24h warning notifications`,
    );

    return { notificationsSent };
  },
});

/**
 * Internal Mutation: Check for tournaments that just started
 */
export const checkTournamentStarted = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const allTournaments = await ctx.db.query("tournaments").collect();

    const recentlyStartedTournaments = allTournaments.filter((tournament) => {
      const startDate = new Date(tournament.startDate);
      return startDate >= oneHourAgo && startDate <= now;
    });

    let notificationsSent = 0;

    for (const tournament of recentlyStartedTournaments) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      const teamMemberPromises = teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamMembers = teamMembersNested.flat();

      const userIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

      for (const userId of userIds) {
        const existing = await ctx.db
          .query("notifications")
          .withIndex("by_user_type_entity", (q) =>
            q
              .eq("userId", userId)
              .eq("type", "tournament_started")
              .eq("relatedEntityType", "tournament")
              .eq("relatedEntityId", tournament._id),
          )
          .first();

        if (!existing) {
          await ctx.db.insert("notifications", {
            userId,
            type: "tournament_started",
            title: `${tournament.name} has started!`,
            body: "Good luck! Start submitting your activities.",
            relatedEntityId: tournament._id,
            relatedEntityType: "tournament",
            actionUrl: `/tournaments/${tournament._id}`,
            isRead: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          });
          notificationsSent++;
        }
      }
    }

    console.log(`Sent ${notificationsSent} tournament started notifications`);

    return { notificationsSent };
  },
});

/**
 * Internal Mutation: Check for tournaments ending in 24 hours
 */
export const checkTournamentEnding24h = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const allTournaments = await ctx.db.query("tournaments").collect();

    const tournamentsEndingSoon = allTournaments.filter((tournament) => {
      const endDate = new Date(tournament.endDate);
      return endDate >= windowStart && endDate <= windowEnd;
    });

    let notificationsSent = 0;

    for (const tournament of tournamentsEndingSoon) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      const teamMemberPromises = teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamMembers = teamMembersNested.flat();

      const userIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

      for (const userId of userIds) {
        const existing = await ctx.db
          .query("notifications")
          .withIndex("by_user_type_entity", (q) =>
            q
              .eq("userId", userId)
              .eq("type", "tournament_ending_24h")
              .eq("relatedEntityType", "tournament")
              .eq("relatedEntityId", `${tournament._id}_${tournament.endDate}`),
          )
          .first();

        if (!existing) {
          await ctx.db.insert("notifications", {
            userId,
            type: "tournament_ending_24h",
            title: `${tournament.name} ends in 24 hours`,
            body: "Final chance to submit activities!",
            relatedEntityId: `${tournament._id}_${tournament.endDate}`,
            relatedEntityType: "tournament",
            actionUrl: `/tournaments/${tournament._id}`,
            isRead: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          });
          notificationsSent++;
        }
      }
    }

    console.log(
      `Sent ${notificationsSent} tournament ending 24h warning notifications`,
    );

    return { notificationsSent };
  },
});

/**
 * Internal Mutation: Check for tournaments that just ended
 */
export const checkTournamentEnded = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const allTournaments = await ctx.db.query("tournaments").collect();

    const recentlyEndedTournaments = allTournaments.filter((tournament) => {
      const endDate = new Date(tournament.endDate);
      return endDate >= oneHourAgo && endDate <= now;
    });

    let notificationsSent = 0;

    for (const tournament of recentlyEndedTournaments) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      const teamMemberPromises = teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamMembers = teamMembersNested.flat();

      const userIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

      for (const userId of userIds) {
        const existing = await ctx.db
          .query("notifications")
          .withIndex("by_user_type_entity", (q) =>
            q
              .eq("userId", userId)
              .eq("type", "tournament_ended")
              .eq("relatedEntityType", "tournament")
              .eq("relatedEntityId", tournament._id),
          )
          .first();

        if (!existing) {
          await ctx.db.insert("notifications", {
            userId,
            type: "tournament_ended",
            title: `${tournament.name} has ended`,
            body: "Check the leaderboard to see your team's ranking!",
            relatedEntityId: tournament._id,
            relatedEntityType: "tournament",
            actionUrl: `/tournaments/${tournament._id}`,
            isRead: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          });
          notificationsSent++;
        }
      }
    }

    console.log(`Sent ${notificationsSent} tournament ended notifications`);

    return { notificationsSent };
  },
});

/**
 * Internal Mutation: Send daily digest notification
 */
export const sendDailyDigest = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users with admin or reviewer roles
    const allUserRoles = await ctx.db.query("userRoles").collect();
    const userRoleMap = new Map<Id<"users">, Set<string>>();

    for (const userRole of allUserRoles) {
      if (!userRoleMap.has(userRole.userId)) {
        userRoleMap.set(userRole.userId, new Set());
      }
      const role = await ctx.db.get(userRole.roleId);
      if (role) {
        userRoleMap.get(userRole.userId)?.add(role.name);
      }
    }

    let digestsSent = 0;

    // Find users with pending review items
    for (const [userId, roles] of Array.from(userRoleMap.entries())) {
      if (!roles.has("admin") && !roles.has("reviewer")) continue;

      // Count pending submissions
      const pendingSubmissions = await ctx.db
        .query("submissions")
        .withIndex("by_state", (q) => q.eq("state", "pending"))
        .collect();

      if (pendingSubmissions.length === 0) continue;

      // Check if digest already sent today
      const today = new Date().toISOString().split("T")[0];
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user_type_entity", (q) =>
          q
            .eq("userId", userId)
            .eq("type", "pending_items_digest")
            .eq("relatedEntityType", "digest")
            .eq("relatedEntityId", today),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("notifications", {
          userId,
          type: "pending_items_digest",
          title: "You have pending items requiring attention",
          body: `${pendingSubmissions.length} submission${pendingSubmissions.length === 1 ? "" : "s"} pending approval`,
          relatedEntityId: today,
          relatedEntityType: "digest",
          actionUrl: "/admin/submissions",
          isRead: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        });
        digestsSent++;
      }
    }

    console.log(`Sent ${digestsSent} daily digest notifications`);

    return { digestsSent };
  },
});
