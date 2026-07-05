import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  action,
  internalMutation,
  mutation,
} from "./_generated/server";
import { nowUTC } from "./lib/dates";
import { getCurrentUserOrThrow } from "./users";

// Deletes the pendingUploads rows for the given storage IDs.
// Called from lifecycle/activities within a mutation context.
// Throws if any storage ID is not in pendingUploads or is owned by a different user.
export async function claimUploads(
  ctx: MutationCtx,
  userId: Id<"users">,
  storageIds: Id<"_storage">[],
): Promise<void> {
  for (const storageId of storageIds) {
    const row = await ctx.db
      .query("pendingUploads")
      .filter((q) => q.eq(q.field("storageId"), storageId))
      .first();
    if (!row) {
      throw new Error("Evidence upload not found or already claimed");
    }
    if (row.userId !== userId) {
      throw new Error("Evidence upload does not belong to the current user");
    }
    await ctx.db.delete(row._id);
  }
}

// Deletes storage blobs and their corresponding pendingUploads rows.
// Called from lifecycle/activities within a mutation context.
// The lifecycle module never touches ctx.storage directly.
// The pendingUploads row is deleted before the blob so that the daily
// cron (issue #59) does not attempt a double-delete on retry.
export async function releaseUploads(
  ctx: MutationCtx,
  storageIds: Id<"_storage">[],
): Promise<void> {
  for (const storageId of storageIds) {
    const row = await ctx.db
      .query("pendingUploads")
      .filter((q) => q.eq(q.field("storageId"), storageId))
      .first();
    if (row) await ctx.db.delete(row._id);
    await ctx.storage.delete(storageId);
  }
}

// Testable seam for the daily orphan sweep. Deletes storage blobs and
// pendingUploads rows whose createdAt is strictly older than the given cutoff.
// Tests pass an explicit cutoff; the daily cron calls sweepOrphansCron which
// computes olderThan = now - 24h.
export async function sweepOrphans(
  ctx: MutationCtx,
  olderThan: string,
): Promise<void> {
  const staleRows = await ctx.db
    .query("pendingUploads")
    .withIndex("by_createdAt", (q) => q.lt("createdAt", olderThan))
    .collect();
  for (const row of staleRows) {
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete(row._id);
  }
}

// Daily cron entry point; computes the 24-hour cutoff and calls sweepOrphans.
export const sweepOrphansCron = internalMutation({
  args: {},
  handler: async (ctx) => {
    const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await sweepOrphans(ctx, olderThan);
  },
});

// Generates a Convex storage upload URL.
// The storageId is only available in the upload response body; call
// registerUpload(storageId) immediately after the upload completes.
export const issueUploadUrl = action({
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// Registers a completed upload in pendingUploads.
// Call this immediately after the upload response gives you the storageId.
// The daily cron (issue #59) sweeps unclaimed rows older than 24 hours.
export const registerUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await ctx.db.insert("pendingUploads", {
      storageId: args.storageId,
      userId: user._id,
      createdAt: nowUTC(),
    });
  },
});
