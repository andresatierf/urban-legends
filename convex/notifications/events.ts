import { type Infer, v } from "convex/values";

// Discriminated union describing every domain transition that can produce a
// user-facing notification. Lifecycle functions emit these as pure values;
// public mutations forward them to `Notifier.publish`. The Notifier owns the
// mapping from event → notification(s) and is the only consumer.
//
// All 10 variants are typed up front so subsequent migration slices add no
// new declarations. Only `role.granted` is wired today; the others throw
// "not yet migrated" in `dispatch` until their slice lands.
export const notificationEventValidator = v.union(
  v.object({
    type: v.literal("submission.created"),
    submissionId: v.id("submissions"),
  }),
  v.object({
    type: v.literal("submission.approved"),
    submissionId: v.id("submissions"),
  }),
  v.object({
    type: v.literal("submission.rejected"),
    submissionId: v.id("submissions"),
    reason: v.optional(v.string()),
  }),
  v.object({
    type: v.literal("joinRequest.created"),
    joinRequestId: v.id("joinRequests"),
  }),
  v.object({
    type: v.literal("joinRequest.accepted"),
    joinRequestId: v.id("joinRequests"),
  }),
  v.object({
    type: v.literal("joinRequest.rejected"),
    joinRequestId: v.id("joinRequests"),
  }),
  v.object({
    type: v.literal("teamMember.removed"),
    userId: v.id("users"),
    teamId: v.id("teams"),
  }),
  v.object({
    type: v.literal("role.granted"),
    userId: v.id("users"),
    roleId: v.id("roles"),
  }),
  v.object({
    type: v.literal("role.revoked"),
    userId: v.id("users"),
    roleId: v.id("roles"),
  }),
  v.object({
    type: v.literal("tournament.ended"),
    tournamentId: v.id("tournaments"),
  }),
);

export type NotificationEvent = Infer<typeof notificationEventValidator>;
