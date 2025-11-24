# Spec 26: Submission Image Upload with S3 Storage Abstraction

**Status**: Draft
**Created**: 2025-11-22
**Owner**: Andre
**Related**: Spec 25 (Original Image Upload Backend), Spec 24 (Card View Presentation)
**Implementation Approach**: Convex Actions + Custom Storage Abstraction Layer

---

## Executive Summary

Implement a production-ready image upload system for tournament submissions using **Convex Actions** with a **custom TypeScript storage abstraction layer**. The abstraction enables easy provider swapping (S3, Cloudflare R2, Vercel Blob, etc.) through a unified interface. Initial implementation uses **AWS S3** with presigned URL uploads for security and scalability.

**Primary Benefits**:
- Visual proof of activity completion for tournament integrity
- Provider-agnostic architecture for future flexibility (swap S3 for R2 with config change)
- Secure, authenticated uploads via presigned URLs
- Type-safe integration with Convex's auto-generated types

**Complexity**: Large (4-6 days)
**Dependencies**: AWS S3 bucket, IAM permissions, AWS SDK

---

## Feature Requirements

### Functional Requirements

**Image Upload Workflow**:
1. User uploads 1-3 images per submission as proof of activity
2. Frontend requests presigned upload URL from Convex action
3. User's browser uploads directly to S3 (bypassing backend)
4. Frontend saves image metadata to Convex database
5. Images display in submission cards with lightbox viewer

**File Validation**:
- **Allowed formats**: JPEG, PNG, WebP, HEIC
- **Size limits**:
  - Per-image: 10MB maximum
  - Total submission: 25MB maximum (conservative for 3 × 10MB)
- **Count limits**:
  - Minimum: 1 image required before submission moves to "pending" state
  - Maximum: 3 images per submission

**Access Control**:
- Only submission owner or team members can upload images
- Only submission owner, team members, and admins can view images
- Admins can delete images from any submission
- Users can delete images from their own draft submissions only

**Image Deletion**:
- Deleting an image removes it from both S3 and database
- Cascade delete: removing submission deletes all associated images from S3 and database
- Cannot delete images from approved submissions (unless admin)

**Error Handling**:
- Invalid file types rejected with clear error messages
- Oversized files rejected before upload begins
- Network failures during upload provide retry mechanism
- Missing S3 credentials fail gracefully with admin alert

### Non-Functional Requirements

**Performance**:
- Presigned URL generation: < 500ms
- Direct-to-S3 upload: limited by user's network (not backend bottleneck)
- Image display: < 1s for first image (lazy loading for subsequent)
- Parallel uploads supported (all 3 images upload simultaneously)

**Security**:
- Presigned URLs expire after 15 minutes
- All uploads authenticated via Convex (getCurrentUserOrThrow)
- S3 bucket is private (no public access)
- Image URLs generated on-demand with Convex auth check

**Scalability**:
- Direct S3 uploads prevent backend bandwidth bottleneck
- CDN-backed S3 URLs for fast global delivery
- Storage abstraction allows migration to cheaper providers

**Accessibility**:
- Image alt text uses original filename
- Keyboard navigation in lightbox modal
- Screen reader announcements for upload progress

**Mobile Responsiveness**:
- Upload button optimized for touch targets
- Image preview works on mobile screens
- Camera capture integration (HTML5 file input)

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │ ImageUploader    │        │ SubmissionCard   │          │
│  │ Component        │        │ Image Display    │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
│           │ useAction                  │ useQuery           │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend (Actions/Queries)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Actions (Node.js Runtime - 3rd party libs allowed)  │  │
│  │  - generateUploadUrl(submissionId, filename)         │  │
│  │  - deleteImage(imageId)                              │  │
│  │  Uses: StorageProvider interface                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Mutations (Database Operations)                     │  │
│  │  - saveImageMetadata(submissionId, s3Key, ...)       │  │
│  │  - removeImageMetadata(imageId)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Queries (Real-time Data)                            │  │
│  │  - getSubmissionImages(submissionId)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│            Storage Abstraction Layer (TypeScript)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Interface: StorageProvider                          │  │
│  │  - generatePresignedUrl(key, contentType, expires)   │  │
│  │  - getPublicUrl(key)                                 │  │
│  │  - deleteFile(key)                                   │  │
│  │  - generateUniqueKey(submissionId, filename)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Implementation: S3StorageProvider                   │  │
│  │  Uses: @aws-sdk/client-s3, @aws-sdk/s3-request-...   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Factory: createStorageProvider()                    │  │
│  │  Returns provider based on env config                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AWS S3 Bucket                          │
│  - Private bucket (no public access)                        │
│  - CORS enabled for browser uploads                         │
│  - Lifecycle rules for cleanup (optional)                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Database Schema Changes

#### New Table: `submissionImages`

```typescript
// convex/schema.ts (ADD TO EXISTING SCHEMA)

submissionImages: defineTable({
  submissionId: v.id("submissions"),
  storageKey: v.string(),            // S3 key (path in bucket)
  storageProvider: v.string(),       // "s3" | "r2" | "vercel-blob"
  uploadedBy: v.id("users"),
  uploadedAt: v.string(),            // ISO timestamp
  filename: v.string(),              // Original filename
  contentType: v.string(),           // MIME type (image/jpeg, etc.)
  size: v.number(),                  // Bytes
  order: v.number(),                 // Display order (0, 1, 2)
})
  .index("by_submission", ["submissionId"])
  .index("by_submission_and_order", ["submissionId", "order"])
  .index("by_user", ["uploadedBy"])
  .index("by_storage_key", ["storageKey"]), // For cleanup operations
```

**Key Differences from Spec 25**:
- `storageKey` (S3 path) instead of `storageId` (Convex storage ID)
- `storageProvider` field enables multi-provider support
- `size` tracked for quota enforcement
- No direct URL storage (URLs generated on-demand via actions)

**Migration Strategy**:
- Table is additive (no changes to existing schema)
- Existing submissions without images continue to work
- No data migration needed

---

### Storage Abstraction Layer

#### Interface Definition

```typescript
// convex/lib/storage/types.ts

/**
 * Storage provider interface for abstracted file storage.
 * Implementations: S3, Cloudflare R2, Vercel Blob, etc.
 */
export interface StorageProvider {
  /**
   * Generate a presigned URL for direct client upload
   * @param key - Unique storage key (path in bucket)
   * @param contentType - MIME type of file
   * @param expiresIn - Expiration time in seconds (default: 900 = 15 minutes)
   * @returns Presigned upload URL and storage key
   */
  generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<{
    uploadUrl: string;
    storageKey: string;
    expiresAt: string; // ISO timestamp
  }>;

  /**
   * Generate a public/authenticated URL for viewing a file
   * @param key - Storage key
   * @param expiresIn - Optional expiration for signed URLs (default: 3600 = 1 hour)
   * @returns URL to access the file
   */
  getPublicUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage
   * @param key - Storage key
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Generate a unique storage key for a file
   * @param submissionId - Submission ID (for namespacing)
   * @param filename - Original filename
   * @returns Unique storage key
   */
  generateUniqueKey(submissionId: string, filename: string): string;

  /**
   * Validate configuration (called on initialization)
   * @throws Error if configuration is invalid
   */
  validateConfig(): Promise<void>;
}

/**
 * Configuration for storage providers
 */
export interface StorageConfig {
  provider: "s3" | "r2" | "vercel-blob";

  // S3 / R2 specific
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string; // For R2 or custom S3 endpoints

  // Vercel Blob specific
  vercelBlobToken?: string;
}
```

#### S3 Provider Implementation

```typescript
// convex/lib/storage/s3-provider.ts

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "./types";

/**
 * AWS S3 implementation of the StorageProvider interface
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string; // Optional custom endpoint (for S3-compatible services)
  }) {
    this.bucket = config.bucket;
    this.region = config.region;

    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { endpoint: config.endpoint }),
    });
  }

  async validateConfig(): Promise<void> {
    // Attempt a simple operation to verify credentials
    try {
      // This will throw if credentials are invalid
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: "__health_check__", // This doesn't need to exist
      });

      // We expect this to fail (file doesn't exist), but it validates auth
      await getSignedUrl(this.client, command, { expiresIn: 60 });
    } catch (error) {
      // If error is NOT "NoSuchKey", it means auth/config is wrong
      if (error instanceof Error && !error.message.includes("NoSuchKey")) {
        throw new Error(
          `S3 configuration validation failed: ${error.message}`,
        );
      }
    }
  }

  generateUniqueKey(submissionId: string, filename: string): string {
    // Structure: submissions/{submissionId}/{timestamp}-{random}-{filename}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Sanitize filename (remove special characters, preserve extension)
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .substring(0, 100); // Limit filename length

    return `submissions/${submissionId}/${timestamp}-${random}-${sanitized}`;
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 900, // 15 minutes default
  ): Promise<{
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
  }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn,
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      uploadUrl,
      storageKey: key,
      expiresAt,
    };
  }

  async getPublicUrl(key: string, expiresIn = 3600): Promise<string> {
    // Generate signed URL for GET request (1 hour default)
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }
}
```

#### Factory Function

```typescript
// convex/lib/storage/factory.ts

import { S3StorageProvider } from "./s3-provider";
import type { StorageProvider, StorageConfig } from "./types";

/**
 * Factory function to create storage provider based on configuration
 * This is the single point where you swap providers
 */
export async function createStorageProvider(
  config?: StorageConfig,
): Promise<StorageProvider> {
  // Default to environment variables if no config provided
  const providerType =
    config?.provider || (process.env.STORAGE_PROVIDER as "s3" | "r2");

  switch (providerType) {
    case "s3": {
      const s3Config = {
        region: config?.region || process.env.AWS_REGION || "us-east-1",
        bucket: config?.bucket || process.env.AWS_S3_BUCKET || "",
        accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey:
          config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
        endpoint: config?.endpoint || process.env.AWS_S3_ENDPOINT,
      };

      // Validate required fields
      if (!s3Config.bucket || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
        throw new Error(
          "Missing required S3 configuration. Ensure AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.",
        );
      }

      const provider = new S3StorageProvider(s3Config);
      await provider.validateConfig();
      return provider;
    }

    case "r2": {
      // Cloudflare R2 is S3-compatible, use S3StorageProvider with custom endpoint
      const r2Config = {
        region: "auto", // R2 uses "auto" region
        bucket: config?.bucket || process.env.R2_BUCKET || "",
        accessKeyId: config?.accessKeyId || process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey:
          config?.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || "",
        endpoint:
          config?.endpoint ||
          process.env.R2_ENDPOINT ||
          `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      };

      if (!r2Config.bucket || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
        throw new Error(
          "Missing required R2 configuration. Ensure R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set.",
        );
      }

      const provider = new S3StorageProvider(r2Config);
      await provider.validateConfig();
      return provider;
    }

    default:
      throw new Error(`Unsupported storage provider: ${providerType}`);
  }
}
```

**To Add Vercel Blob Support (Future)**:
1. Create `convex/lib/storage/vercel-blob-provider.ts` implementing `StorageProvider`
2. Add `case "vercel-blob"` to factory
3. Install `@vercel/blob` package
4. Update environment variables

---

### Backend API Design

#### Convex Actions (Node.js runtime, can use AWS SDK)

```typescript
// convex/submissionImages.ts (NEW FILE)

import { v } from "convex/values";
import { action } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { createStorageProvider } from "./lib/storage/factory";
import { api } from "./_generated/api";

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
    const user = await getCurrentUserOrThrow(ctx);

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
    const user = await getCurrentUserOrThrow(ctx);

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
```

#### Convex Mutations (Database operations)

```typescript
// convex/submissionImages.ts (CONTINUED - same file as above)

import { mutation, query } from "./_generated/server";

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
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
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
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
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
```

#### Update Existing Submission Mutations

```typescript
// convex/submissions.ts (UPDATE EXISTING FUNCTIONS)

/**
 * Update upsert mutation to validate minimum image count
 */
export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    // ... existing args ...
  },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: If finalizing submission (moving to pending), validate images
    if (args._id) {
      const existing = await ctx.db.get(args._id);

      if (existing && existing.state === "pending") {
        // Check image count
        const images = await ctx.db
          .query("submissionImages")
          .withIndex("by_submission", (q) => q.eq("submissionId", args._id!))
          .collect();

        if (images.length < 1) {
          throw new Error(
            "Please upload at least 1 image as proof of activity before submitting",
          );
        }
      }
    }

    // ... rest of existing logic ...
  },
});

/**
 * Update remove mutation to cascade delete images
 */
export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: Delete all associated images
    await deleteSubmissionImages(ctx, args.submissionId);

    // ... rest of existing deletion logic ...
  },
});

/**
 * Helper function to cascade delete images
 * Called when submission is deleted
 */
async function deleteSubmissionImages(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
): Promise<void> {
  const images = await ctx.db
    .query("submissionImages")
    .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
    .collect();

  // Note: This only deletes metadata
  // Actual S3 deletion should be done via scheduled job or action
  // For now, we'll leave orphaned S3 files (can be cleaned up later)
  await Promise.all(images.map((img) => ctx.db.delete(img._id)));

  // TODO (Phase 2): Schedule action to delete S3 files
  // This requires Convex scheduled functions (not available in mutations)
}
```

---

### Frontend Implementation

#### Image Upload Component

```typescript
// src/components/submissions/image-uploader.tsx (NEW FILE)

"use client";

import { useAction, useMutation } from "convex/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ImageUploaderProps {
  submissionId: Id<"submissions">;
  currentImageCount: number;
  onUploadComplete: () => void;
}

export function ImageUploader({
  submissionId,
  currentImageCount,
  onUploadComplete,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateUploadUrl = useAction(api.submissionImages.generateUploadUrl);
  const saveImageMetadata = useMutation(api.submissionImages.saveImageMetadata);

  const maxImages = 3;
  const remainingSlots = maxImages - currentImageCount;

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate count
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const totalFiles = files.length;
      let completed = 0;

      // Upload all files in parallel
      await Promise.all(
        Array.from(files).map(async (file) => {
          // 1. Validate file type
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
          ];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(
              `Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and HEIC allowed.`,
            );
          }

          // 2. Validate file size (10MB)
          const MAX_SIZE = 10 * 1024 * 1024;
          if (file.size > MAX_SIZE) {
            throw new Error(
              `Image ${file.name} exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
            );
          }

          // 3. Generate presigned URL
          const { uploadUrl, storageKey, provider } = await generateUploadUrl({
            submissionId,
            filename: file.name,
            contentType: file.type,
            size: file.size,
          });

          // 4. Upload to S3
          const response = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}: ${response.statusText}`);
          }

          // 5. Save metadata to Convex
          await saveImageMetadata({
            submissionId,
            storageKey,
            storageProvider: provider,
            filename: file.name,
            contentType: file.type,
            size: file.size,
          });

          // Update progress
          completed++;
          setProgress((completed / totalFiles) * 100);
        }),
      );

      toast.success(`Uploaded ${totalFiles} image(s) successfully`);
      onUploadComplete();

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload images",
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || remainingSlots === 0}
          onClick={() => document.getElementById("image-upload-input")?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              Add Images ({currentImageCount}/{maxImages})
            </>
          )}
        </Button>

        <input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || remainingSlots === 0}
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-muted-foreground text-sm">
            Uploading {Math.round(progress)}%...
          </p>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Upload 1-3 images (JPEG, PNG, WebP, HEIC). Max 10MB per image.
      </p>
    </div>
  );
}
```

#### Image Display Component (Updated)

```typescript
// src/components/submissions/submission-card-image.tsx (UPDATE EXISTING)

"use client";

import { useAction } from "convex/react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SubmissionCardImageProps {
  submissionId: Id<"submissions">;
}

export function SubmissionCardImage({
  submissionId,
}: SubmissionCardImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<
    Array<{
      _id: string;
      url: string;
      filename: string;
    }>
  >([]);

  const getImageUrls = useAction(api.submissionImages.getImageUrls);

  // Fetch image URLs when component mounts
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const imageUrls = await getImageUrls({ submissionId });
        setImages(imageUrls);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };

    fetchImages();
  }, [submissionId, getImageUrls]);

  // ... rest of existing component code (unchanged)
  // Display logic remains the same as current implementation
}
```

#### Integration with Submission Form

```typescript
// src/components/form/upsert-submission-form.tsx (UPDATE EXISTING)

"use client";

import { useQuery } from "convex/react";
import { ImageUploader } from "@/components/submissions/image-uploader";
import { api } from "@/../convex/_generated/api";

export function UpsertSubmissionForm({ submissionId }: { submissionId?: Id<"submissions"> }) {
  const images = useQuery(
    api.submissionImages.list,
    submissionId ? { submissionId } : "skip",
  );

  // ... existing form logic ...

  return (
    <form>
      {/* Existing form fields ... */}

      {/* Image Upload Section */}
      {submissionId && (
        <div className="space-y-2">
          <label className="font-medium text-sm">
            Activity Photos <span className="text-destructive">*</span>
          </label>
          <ImageUploader
            submissionId={submissionId}
            currentImageCount={images?.length || 0}
            onUploadComplete={() => {
              // Refetch images query
              // Convex will automatically update via reactive queries
            }}
          />

          {images && images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img._id} className="relative">
                  {/* Image preview */}
                  <img
                    src={img.url} // Note: This would need getImageUrls action
                    alt={img.filename}
                    className="h-24 w-full rounded object-cover"
                  />
                  {/* Delete button */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing submit button ... */}
    </form>
  );
}
```

---

## Environment Variables

### Required Configuration

```bash
# .env.local (ADD THESE)

# Storage Provider Configuration
STORAGE_PROVIDER=s3  # Options: "s3" | "r2" | "vercel-blob"

# AWS S3 Configuration (for STORAGE_PROVIDER=s3)
AWS_REGION=us-east-1
AWS_S3_BUCKET=urban-legends-submissions
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_ENDPOINT=  # Optional: custom S3-compatible endpoint

# Cloudflare R2 Configuration (for STORAGE_PROVIDER=r2)
# R2_BUCKET=urban-legends-submissions
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_ACCOUNT_ID=...
# R2_ENDPOINT=  # Auto-generated from account ID if not provided

# Vercel Blob Configuration (for STORAGE_PROVIDER=vercel-blob)
# VERCEL_BLOB_TOKEN=...
```

### S3 Bucket Configuration

**CORS Policy** (required for browser uploads):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Bucket Policy** (private bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::urban-legends-submissions/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::ACCOUNT_ID:user/convex-backend"
        }
      }
    }
  ]
}
```

**IAM Permissions** (minimum required):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::urban-legends-submissions/*"
    }
  ]
}
```

---

## Dependencies

### NPM Packages to Install

```bash
# AWS SDK for S3 operations (required for initial implementation)
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Optional: Zod for runtime validation (already installed)
# Already in package.json: "zod": "^4.1.12"
```

### Future Dependencies (for other providers)

```bash
# Cloudflare R2 (no additional package needed - uses S3 SDK)

# Vercel Blob
bun add @vercel/blob
```

---

## Implementation Plan

### Phase 1: Foundation (Day 1-2)

**Tasks**:
1. Create storage abstraction layer
   - Define `StorageProvider` interface (`convex/lib/storage/types.ts`)
   - Implement `S3StorageProvider` (`convex/lib/storage/s3-provider.ts`)
   - Create factory function (`convex/lib/storage/factory.ts`)

2. Update database schema
   - Add `submissionImages` table to `convex/schema.ts`
   - Deploy schema changes to Convex

3. Set up S3 bucket
   - Create S3 bucket in AWS console
   - Configure CORS policy
   - Create IAM user with appropriate permissions
   - Add environment variables to `.env.local`

**Validation**:
- Factory function can create S3StorageProvider
- `validateConfig()` successfully connects to S3
- Presigned URLs can be generated
- Test upload to S3 via Postman/curl

### Phase 2: Backend API (Day 2-3)

**Tasks**:
1. Implement Convex actions
   - `generateUploadUrl` (presigned URL generation)
   - `deleteImage` (S3 + metadata deletion)
   - `getImageUrls` (signed URL generation for viewing)

2. Implement Convex mutations
   - `saveImageMetadata` (after S3 upload)
   - `removeMetadata` (cleanup)

3. Implement Convex queries
   - `list` (get images for submission)
   - `getById` (single image lookup)

4. Update existing submissions mutations
   - Add image count validation to `upsert`
   - Add cascade delete to `remove`

**Validation**:
- Test actions via Convex dashboard
- Verify presigned URL upload with curl
- Confirm metadata saves correctly
- Test permission checks (owner vs non-owner)

### Phase 3: Frontend Components (Day 3-4)

**Tasks**:
1. Create `ImageUploader` component
   - File input with validation
   - Progress indicator
   - Error handling
   - Toast notifications

2. Update `SubmissionCardImage` component
   - Fetch images via `getImageUrls` action
   - Display loading states
   - Handle missing images gracefully

3. Integrate with submission form
   - Add upload section to form
   - Show image previews
   - Delete button per image
   - Validation messaging

**Validation**:
- Upload 1-3 images successfully
- View uploaded images in submission card
- Delete images via UI
- Error messages display correctly

### Phase 4: Polish & Testing (Day 4-5)

**Tasks**:
1. Error handling
   - Network failure retry logic
   - S3 credential errors
   - Upload timeout handling
   - Quota exceeded errors

2. Loading states
   - Skeleton loaders for images
   - Upload progress bars
   - Optimistic UI updates

3. Accessibility
   - Keyboard navigation in lightbox
   - Screen reader announcements
   - Focus management

4. Manual testing scenarios
   - Upload on slow connection
   - Upload multiple files
   - Delete while uploading
   - Concurrent uploads by team members
   - Admin deleting other's images

**Validation**:
- All error scenarios handled gracefully
- Loading states display correctly
- WCAG 2.1 AA compliance for new components
- Mobile responsiveness verified

### Phase 5: Documentation & Deployment (Day 5-6)

**Tasks**:
1. Update README with setup instructions
2. Document environment variables
3. Add inline code comments
4. Deploy to production
5. Monitor error logs

**Validation**:
- Production deployment successful
- S3 uploads working in production
- No environment variable issues
- Error monitoring configured

---

## Code Examples (Full Implementation)

### Type Generation Flow

Convex auto-generates TypeScript types for all functions:

```typescript
// convex/_generated/api.d.ts (AUTO-GENERATED by Convex)

export declare const api: {
  submissionImages: {
    generateUploadUrl: FunctionReference<
      "action",
      "public",
      {
        submissionId: Id<"submissions">;
        filename: string;
        contentType: string;
        size: number;
      },
      {
        uploadUrl: string;
        storageKey: string;
        expiresAt: string;
        provider: string;
      }
    >;
    saveImageMetadata: FunctionReference<
      "mutation",
      "public",
      {
        submissionId: Id<"submissions">;
        storageKey: string;
        storageProvider: string;
        filename: string;
        contentType: string;
        size: number;
      },
      Id<"submissionImages">
    >;
    getImageUrls: FunctionReference<
      "action",
      "public",
      { submissionId: Id<"submissions"> },
      Array<{
        _id: string;
        url: string;
        filename: string;
        contentType: string;
        size: number;
        uploadedAt: string;
        order: number;
      }>
    >;
    deleteImage: FunctionReference<
      "action",
      "public",
      { imageId: Id<"submissionImages"> },
      { success: boolean }
    >;
    list: FunctionReference<
      "query",
      "public",
      { submissionId: Id<"submissions"> },
      Array<Doc<"submissionImages">>
    >;
  };
};
```

### Frontend TypeScript Experience

```typescript
// Full type safety from Convex → Frontend

import { useAction, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

function MyComponent() {
  const generateUploadUrl = useAction(api.submissionImages.generateUploadUrl);
  const saveImageMetadata = useMutation(api.submissionImages.saveImageMetadata);

  const handleUpload = async () => {
    // TypeScript knows exact argument types
    const result = await generateUploadUrl({
      submissionId: "123" as Id<"submissions">, // TypeScript enforces correct ID type
      filename: "photo.jpg",
      contentType: "image/jpeg",
      size: 1024000,
    });

    // TypeScript knows exact return type
    const { uploadUrl, storageKey, expiresAt, provider } = result;
    //     ^? string    ^? string      ^? string      ^? string

    // Upload to S3
    await fetch(uploadUrl, { method: "PUT", body: file });

    // Save metadata (TypeScript enforces correct arguments)
    await saveImageMetadata({
      submissionId: "123" as Id<"submissions">,
      storageKey, // Type: string
      storageProvider: provider, // Type: string
      filename: "photo.jpg",
      contentType: "image/jpeg",
      size: 1024000,
    });
  };
}
```

---

## Future Extensibility

### Adding a New Storage Provider (e.g., Cloudflare R2)

**Step 1**: R2 is S3-compatible, so no new provider class needed! Just update factory:

```typescript
// convex/lib/storage/factory.ts (already supports R2)

// Add to .env.local:
STORAGE_PROVIDER=r2
R2_BUCKET=urban-legends-submissions
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
```

**Done!** The existing `S3StorageProvider` works with R2 via custom endpoint.

### Adding Vercel Blob Provider

**Step 1**: Implement `VercelBlobStorageProvider`:

```typescript
// convex/lib/storage/vercel-blob-provider.ts (NEW FILE)

import { put, del, head } from "@vercel/blob";
import type { StorageProvider } from "./types";

export class VercelBlobStorageProvider implements StorageProvider {
  private token: string;

  constructor(config: { token: string }) {
    this.token = config.token;
  }

  async validateConfig(): Promise<void> {
    // Vercel Blob doesn't need explicit validation
    if (!this.token) {
      throw new Error("VERCEL_BLOB_TOKEN is required");
    }
  }

  generateUniqueKey(submissionId: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    return `submissions/${submissionId}/${timestamp}-${random}-${sanitized}`;
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 900,
  ): Promise<{
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
  }> {
    // Vercel Blob uses server-side upload (not presigned URLs)
    // This would require different upload flow
    // For now, throw error (Vercel Blob not fully supported yet)
    throw new Error("Vercel Blob presigned uploads not yet implemented");
  }

  async getPublicUrl(key: string, expiresIn?: number): Promise<string> {
    // Vercel Blob URLs don't expire (public by default)
    return `https://blob.vercel-storage.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await del(key, { token: this.token });
  }
}
```

**Step 2**: Update factory:

```typescript
// convex/lib/storage/factory.ts (ADD CASE)

import { VercelBlobStorageProvider } from "./vercel-blob-provider";

export async function createStorageProvider(
  config?: StorageConfig,
): Promise<StorageProvider> {
  const providerType = config?.provider || process.env.STORAGE_PROVIDER;

  switch (providerType) {
    case "s3": { /* ... existing ... */ }
    case "r2": { /* ... existing ... */ }

    case "vercel-blob": {
      const token = config?.vercelBlobToken || process.env.VERCEL_BLOB_TOKEN;
      if (!token) {
        throw new Error("VERCEL_BLOB_TOKEN is required");
      }
      const provider = new VercelBlobStorageProvider({ token });
      await provider.validateConfig();
      return provider;
    }

    default:
      throw new Error(`Unsupported storage provider: ${providerType}`);
  }
}
```

**Step 3**: Update environment variables:

```bash
# .env.local
STORAGE_PROVIDER=vercel-blob
VERCEL_BLOB_TOKEN=vercel_blob_...
```

**Done!** All actions automatically use Vercel Blob.

---

## Testing Strategy

### Unit Tests (Storage Abstraction)

```typescript
// convex/lib/storage/__tests__/s3-provider.test.ts

import { describe, it, expect, vi } from "vitest";
import { S3StorageProvider } from "../s3-provider";

describe("S3StorageProvider", () => {
  it("generates unique storage keys", () => {
    const provider = new S3StorageProvider({
      region: "us-east-1",
      bucket: "test-bucket",
      accessKeyId: "test",
      secretAccessKey: "test",
    });

    const key1 = provider.generateUniqueKey("sub_123", "photo.jpg");
    const key2 = provider.generateUniqueKey("sub_123", "photo.jpg");

    expect(key1).toMatch(/^submissions\/sub_123\/\d+-[a-z0-9]+-photo\.jpg$/);
    expect(key1).not.toBe(key2); // Keys must be unique
  });

  it("validates configuration", async () => {
    const provider = new S3StorageProvider({
      region: "us-east-1",
      bucket: "test-bucket",
      accessKeyId: "invalid",
      secretAccessKey: "invalid",
    });

    await expect(provider.validateConfig()).rejects.toThrow(
      "S3 configuration validation failed",
    );
  });
});
```

### Integration Tests (Mock Storage Provider)

```typescript
// convex/lib/storage/mock-provider.ts (for testing)

import type { StorageProvider } from "./types";

export class MockStorageProvider implements StorageProvider {
  private files = new Map<string, { url: string; size: number }>();

  async validateConfig(): Promise<void> {
    // Always valid
  }

  generateUniqueKey(submissionId: string, filename: string): string {
    return `mock/${submissionId}/${filename}`;
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 900,
  ): Promise<{
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
  }> {
    return {
      uploadUrl: `https://mock-upload-url.com/${key}`,
      storageKey: key,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async getPublicUrl(key: string): Promise<string> {
    return `https://mock-cdn.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key);
  }
}
```

### Manual Testing Scenarios

1. **Happy Path**:
   - Upload 1-3 images to new submission
   - View images in submission card
   - Delete one image
   - Finalize submission (moves to pending)

2. **Error Cases**:
   - Upload invalid file type (PDF) → error message
   - Upload oversized file (15MB) → error message
   - Upload 4th image → error message
   - Submit without images → error message
   - Network failure during upload → retry mechanism

3. **Permission Tests**:
   - Non-owner tries to upload → denied
   - Team member uploads to team submission → allowed
   - Admin deletes any image → allowed
   - User deletes from approved submission → denied

4. **Concurrency Tests**:
   - Two users upload to same submission simultaneously
   - Upload while viewing images
   - Delete while uploading

---

## Open Questions & Considerations

### 1. Orphaned File Cleanup

**Question**: What if S3 upload succeeds but `saveImageMetadata` fails?

**Current Solution**: File remains in S3 without database record (orphaned)

**Options**:
- **Option A**: Scheduled job to delete S3 files with no metadata (after 24 hours)
- **Option B**: Two-phase commit (upload to temporary key, move on success)
- **Option C**: Accept orphans, clean up manually

**Recommendation**: Option A (scheduled cleanup job in Phase 2)

### 2. Image Compression

**Question**: Should we compress images before uploading?

**Current Solution**: No compression (client uploads original)

**Options**:
- **Option A**: Client-side compression (browser Canvas API)
- **Option B**: Server-side compression (Lambda/Convex action)
- **Option C**: No compression (rely on S3 storage cost)

**Recommendation**: Option C initially, Option A in Phase 2

### 3. HEIC Browser Support

**Question**: Safari uses HEIC, but Chrome doesn't display it

**Current Solution**: Accept HEIC uploads, but may not display correctly

**Options**:
- **Option A**: Convert HEIC to JPEG on server
- **Option B**: Client-side conversion (heic2any library)
- **Option C**: Reject HEIC, only accept JPEG/PNG/WebP

**Recommendation**: Option B (client-side conversion) in Phase 2

### 4. CDN Configuration

**Question**: Should we use CloudFront in front of S3?

**Current Solution**: Direct S3 signed URLs

**Options**:
- **Option A**: CloudFront distribution (better performance, higher cost)
- **Option B**: S3 Transfer Acceleration (faster uploads, moderate cost)
- **Option C**: Direct S3 (simple, lower cost)

**Recommendation**: Option C initially, Option A if performance issues

### 5. Image Metadata

**Question**: Should we extract EXIF data (GPS, camera info)?

**Current Solution**: No EXIF extraction

**Options**:
- **Option A**: Extract and store EXIF (verify location/timestamp)
- **Option B**: Strip EXIF (privacy)
- **Option C**: Preserve EXIF but don't use it

**Recommendation**: Option B (privacy-first) in Phase 2

---

## Success Metrics

**Functional Metrics**:
- 100% of new submissions include at least 1 image
- < 1% upload failure rate (excluding network issues)
- 0 unauthorized image access (permission checks work)

**Performance Metrics**:
- Presigned URL generation: < 500ms (p95)
- Image display (first load): < 1s (p95)
- Upload success rate: > 95%

**Business Metrics**:
- Increased submission quality (visual proof)
- Reduced fraudulent submissions (admin approval)
- User satisfaction with upload experience

**Technical Metrics**:
- 0 orphaned S3 files (after cleanup job implemented)
- Storage cost: < $10/month for 1000 active users
- API error rate: < 0.1%

---

## Migration Checklist

- [ ] Install dependencies (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- [ ] Create S3 bucket with CORS configuration
- [ ] Create IAM user with S3 permissions
- [ ] Add environment variables to `.env.local`
- [ ] Update `convex/schema.ts` with `submissionImages` table
- [ ] Deploy schema changes (`bunx convex dev`)
- [ ] Implement storage abstraction layer
- [ ] Implement Convex actions and mutations
- [ ] Create frontend `ImageUploader` component
- [ ] Update `SubmissionCardImage` component
- [ ] Update submission form with upload section
- [ ] Test upload/delete workflows
- [ ] Deploy to production
- [ ] Monitor error logs and S3 costs

---

## References

- **Spec 25**: Original image upload specification (Convex storage approach)
- **Spec 24**: Submission card view presentation (UI context)
- **Convex Actions Docs**: https://docs.convex.dev/functions/actions
- **AWS S3 Presigned URLs**: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- **AWS SDK v3 (JavaScript)**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Vercel Blob Docs**: https://vercel.com/docs/storage/vercel-blob

---

## Appendix: Example Provider Swap

### Before (S3):

```bash
# .env.local
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=urban-legends-submissions
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### After (Cloudflare R2):

```bash
# .env.local
STORAGE_PROVIDER=r2
R2_BUCKET=urban-legends-submissions
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
```

**No code changes required!** The factory function automatically creates the correct provider based on `STORAGE_PROVIDER` environment variable. All Convex actions continue to work identically.

---

**End of Specification**
