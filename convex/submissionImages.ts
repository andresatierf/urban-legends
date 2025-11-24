import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { createStorageProvider } from "./lib/storage/factory";
import { getCurrentUserOrThrow } from "./users";

/**
 * Generate a presigned URL for uploading an image to S3
 *
 * Client workflow:
 * 1. Call this action to get uploadUrl
 * 2. PUT file directly to uploadUrl (browser -> S3)
 * 3. Call saveImageMetadata mutation with storageKey
 */
export const generateUploadUrl = action({
  args: {
    submissionId: v.id("submissions"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const _user = await getCurrentUserOrThrow(ctx);

    // 2. Validate submission exists and user has permission
    const submission = await ctx.runQuery(api.submissions.get, {
      submissionId: args.submissionId,
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    // Note: getCurrentUserOrThrow in submissions.get already checks ownership

    // 3. Validate file metadata (before generating URL)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];

    if (!allowedTypes.includes(args.contentType)) {
      throw new Error(
        `Invalid file type: ${args.contentType}. Only JPEG, PNG, WebP, and HEIC allowed.`,
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (args.size > MAX_SIZE) {
      throw new Error(
        `Image exceeds 10MB limit (${(args.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    // 4. Check max image count (3)
    const existingImages = await ctx.runQuery(api.submissionImages.list, {
      submissionId: args.submissionId,
    });

    if (existingImages.length >= 3) {
      throw new Error("Maximum 3 images per submission");
    }

    // 5. Generate unique storage key and presigned URL
    const storage = await createStorageProvider();
    const storageKey = storage.generateUniqueKey(
      args.submissionId,
      args.filename,
    );

    const { uploadUrl, expiresAt } = await storage.generatePresignedUrl(
      storageKey,
      args.contentType,
      900, // 15 minutes
    );

    return {
      uploadUrl,
      storageKey,
      expiresAt,
      provider: process.env.STORAGE_PROVIDER || "s3",
    };
  },
});

/**
 * Delete an image from storage and database
 */
export const deleteImage = action({
  args: {
    imageId: v.id("submissionImages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // 1. Get image metadata (includes permission check)
    const image = await ctx.runQuery(api.submissionImages.getById, {
      imageId: args.imageId,
    });

    if (!image) {
      throw new Error("Image not found");
    }

    // 2. Get submission for permission check
    const submission = await ctx.runQuery(api.submissions.get, {
      submissionId: image.submissionId,
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    // 3. Check permission (owner or admin)
    const isOwner = submission.userId === user._id;
    const isAdmin =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("tournament_manager");

    if (!isOwner && !isAdmin) {
      throw new Error("Permission denied");
    }

    // 4. Cannot delete from approved submissions (unless admin)
    if (submission.state === "approved" && !isAdmin) {
      throw new Error("Cannot delete images from approved submissions");
    }

    // 5. Delete from storage
    const storage = await createStorageProvider();
    await storage.deleteFile(image.storageKey);

    // 6. Delete metadata from database
    await ctx.runMutation(api.submissionImages.removeMetadata, {
      imageId: args.imageId,
    });

    return { success: true };
  },
});

/**
 * Generate public URLs for a submission's images
 * (Used by frontend to display images)
 */
export const getImageUrls = action({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const _user = await getCurrentUserOrThrow(ctx);

    // 1. Get images metadata (includes permission check)
    const images = await ctx.runQuery(api.submissionImages.list, {
      submissionId: args.submissionId,
    });

    // 2. Generate signed URLs for all images
    const storage = await createStorageProvider();

    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        const url = await storage.getPublicUrl(img.storageKey, 3600); // 1 hour

        return {
          _id: img._id,
          url,
          filename: img.filename,
          contentType: img.contentType,
          size: img.size,
          uploadedAt: img.uploadedAt,
          order: img.order,
        };
      }),
    );

    return imagesWithUrls.sort((a, b) => a.order - b.order);
  },
});

/**
 * Save image metadata after successful upload to S3
 *
 * Called by frontend AFTER uploading file to presigned URL
 */
export const saveImageMetadata = mutation({
  args: {
    submissionId: v.id("submissions"),
    storageKey: v.string(),
    storageProvider: v.string(),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // 1. Verify submission exists and user has permission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.userId !== user._id) {
      if (submission.submissionType === "team") {
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (q) =>
            q.eq("teamId", submission.teamId).eq("userId", user._id),
          )
          .first();

        if (!membership) {
          throw new Error("Permission denied");
        }
      } else {
        throw new Error("Permission denied");
      }
    }

    // 2. Cannot modify approved submissions
    if (submission.state === "approved") {
      throw new Error("Cannot add images to approved submissions");
    }

    // 3. Validate content type (server-side validation)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(args.contentType)) {
      throw new Error(`Invalid file type: ${args.contentType}`);
    }

    // 4. Validate size
    const MAX_SIZE = 10 * 1024 * 1024;
    if (args.size > MAX_SIZE) {
      throw new Error("Image exceeds 10MB limit");
    }

    // 5. Check max count
    const existingImages = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    if (existingImages.length >= 3) {
      throw new Error("Maximum 3 images per submission");
    }

    // 6. Determine order (next available slot)
    const order =
      existingImages.length > 0
        ? Math.max(...existingImages.map((img) => img.order)) + 1
        : 0;

    // 7. Save metadata
    const imageId = await ctx.db.insert("submissionImages", {
      submissionId: args.submissionId,
      storageKey: args.storageKey,
      storageProvider: args.storageProvider,
      uploadedBy: user._id,
      uploadedAt: new Date().toISOString(),
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      order,
    });

    return imageId;
  },
});

/**
 * Remove image metadata from database
 * (Called by deleteImage action AFTER deleting from S3)
 */
export const removeMetadata = mutation({
  args: {
    imageId: v.id("submissionImages"),
  },
  handler: async (ctx, args) => {
    // Permission checks already done in deleteImage action
    await ctx.db.delete(args.imageId);
  },
});

/**
 * List images for a submission
 */
export const list = query({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // 1. Get submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // 2. Check permission (owner, team member, or admin)
    const isOwner = submission.userId === user._id;
    const isAdmin =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("tournament_manager");

    let isTeamMember = false;
    if (!isOwner && !isAdmin && submission.submissionType === "team") {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", submission.teamId).eq("userId", user._id),
        )
        .first();
      isTeamMember = !!membership;
    }

    if (!isOwner && !isTeamMember && !isAdmin) {
      throw new Error("Permission denied");
    }

    // 3. Get images (metadata only, no URLs yet)
    const images = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    return images.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get single image by ID (for permission checks in actions)
 */
export const getById = query({
  args: {
    imageId: v.id("submissionImages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const image = await ctx.db.get(args.imageId);
    if (!image) {
      return null;
    }

    // Permission check via submission
    const submission = await ctx.db.get(image.submissionId);
    if (!submission) {
      return null;
    }

    const isOwner = submission.userId === user._id;
    const isAdmin =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("tournament_manager");

    let isTeamMember = false;
    if (!isOwner && !isAdmin && submission.submissionType === "team") {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", submission.teamId).eq("userId", user._id),
        )
        .first();
      isTeamMember = !!membership;
    }

    if (!isOwner && !isTeamMember && !isAdmin) {
      throw new Error("Permission denied");
    }

    return image;
  },
});
