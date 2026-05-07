import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action, type MutationCtx, mutation } from "./_generated/server";
import { nowUTC } from "./lib/dates";
import { getCurrentUserOrThrow } from "./users";

// Deletes the pendingUploads rows for the given storage IDs.
// Called from lifecycle/submissions within a mutation context.
// Ownership check deferred to slice #2 (#53) — for now, claim whatever is passed.
export async function claimUploads(
  ctx: MutationCtx,
  userId: Id<"users">,
  storageIds: Id<"_storage">[],
): Promise<void> {
  for (const storageId of storageIds) {
    const row = await ctx.db
      .query("pendingUploads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("storageId"), storageId))
      .first();
    if (row) await ctx.db.delete(row._id);
  }
}

// Deletes storage blobs and their corresponding pendingUploads rows.
// Called from lifecycle/submissions within a mutation context.
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

// Generates a Convex storage upload URL.
// The storageId is only available in the upload response body — call
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
