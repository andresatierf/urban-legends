# Spec 26: Submission Image Upload with UploadThing + S3

**Status**: Draft
**Created**: 2025-11-22
**Owner**: Andre
**Related**: Spec 25 (Original Convex Storage Spec), Spec 24 (Card View Presentation)

## Executive Summary

This specification adapts the requirements from Spec 25 (Submission Image Upload Backend) to use **UploadThing SDK with S3 as the storage backend** instead of Convex's native file storage. UploadThing provides a modern file upload solution with type-safe routes, presigned URL generation, and automatic type inference from backend to frontend. The implementation maintains all security and validation requirements from Spec 25 while leveraging S3 for scalable, production-grade storage.

**Primary User Benefit**: Users can securely upload 1-3 images per submission as proof of tournament activities, with a best-in-class upload experience featuring progress tracking, drag-and-drop, and real-time validation.

**Business Value**: Tournament integrity through visual proof, reduced fraudulent submissions, and enhanced user engagement.

**Complexity Estimate**: Medium (2-3 days for full implementation including testing)

---

## Feature Requirements

### Functional Requirements

1. **Image Upload Capabilities**:
   - Users must upload 1-3 images per submission as proof of activity
   - Supported formats: JPEG, PNG, WebP, HEIC
   - Maximum file size: 10MB per image
   - Maximum total submission size: 25MB (accommodating 3 images with overhead)
   - Uploads use presigned URLs for direct-to-S3 transfer (no server proxy for file data)
   - Multi-image uploads support parallel processing

2. **User Workflows**:
   - **Draft Mode**: Users can upload images while creating/editing a submission in "draft" state
   - **Finalization**: Submissions cannot move to "pending" state without at least 1 image
   - **Image Management**: Users can delete/replace images before submission approval
   - **Team Submissions**: Any team member can view images for team submissions
   - **Admin Review**: Admins can view all submission images during approval workflow

3. **Image Viewing**:
   - Card view displays images in responsive grid (1 large, 2 side-by-side, or thumbnail strip)
   - Lightbox modal for full-size image viewing with navigation
   - Images lazy-load for performance
   - Alt text and filename metadata preserved

4. **Validation & Security**:
   - Client-side validation (early feedback on file type/size)
   - Server-side validation (authoritative, cannot be bypassed)
   - MIME type checking (not just extension-based)
   - Auth-gated upload URLs (only authenticated users can upload)
   - Permission checks (only submission owners/team members can upload)
   - Automatic cleanup of failed uploads

5. **Edge Cases**:
   - Handle concurrent uploads (3 simultaneous image uploads)
   - Network failure recovery (retry logic, clear error messages)
   - Submission deletion cascades to image cleanup
   - Orphaned file cleanup (images uploaded but never linked to submission)
   - Rate limiting on upload URL generation

### Non-Functional Requirements

1. **Performance**:
   - Upload progress tracking with percentage display
   - Parallel uploads for multiple images (not sequential)
   - CDN delivery for image viewing (S3 + CloudFront or similar)
   - Average upload time: <10 seconds for 5MB image
   - Time to first byte (TTFB) for image viewing: <200ms

2. **Security**:
   - UploadThing middleware validates authentication before upload
   - Presigned URLs expire after 1 hour
   - S3 bucket access restricted (no public read)
   - Images served via UploadThing proxy or CloudFront with signed URLs
   - File type validation on both client and server
   - No storage of sensitive EXIF data in metadata

3. **Accessibility**:
   - Image upload component keyboard-navigable
   - Screen reader announcements for upload progress
   - Alt text generated from filename
   - Focus management in lightbox modal
   - High-contrast mode support

4. **Mobile Responsiveness**:
   - Native camera integration on mobile devices
   - Touch-friendly drag-and-drop zones
   - Optimized image grid for small screens
   - Adaptive image quality based on network speed (future enhancement)

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UpsertSubmissionForm                                    │  │
│  │  - ImageUploader component                               │  │
│  │  - useUploadThing hook                                   │  │
│  │  - Client-side validation (Zod)                          │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│                      │ 1. Request upload URL                    │
│                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/uploadthing/route.ts                               │  │
│  │  - Calls UploadThing file router                         │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└────────────────────┼┼┼────────────────────────────────────────┘
                      │││
                      │││ 2. Middleware checks auth/permissions
                      │││
                      ▼▼▼
┌─────────────────────────────────────────────────────────────────┐
│                    UploadThing Service                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  File Router (app/api/uploadthing/core.ts)               │  │
│  │  - submissionImageUploader route                         │  │
│  │  - Middleware: getCurrentUser(), check permissions       │  │
│  │  - Config: maxFileSize, maxFileCount, acceptedFileTypes  │  │
│  │  - onUploadComplete callback                             │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│                      │ 3. Generate presigned URL                │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       │ 4. Return URL to client
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
│  - Uploads file directly to S3 via presigned URL                │
│  - Shows progress bar                                           │
│  - Polls UploadThing for completion                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ 5. Direct upload to S3
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      S3 Bucket (UploadThing)                    │
│  - Stores files with unique keys                                │
│  - Private bucket (no public access)                            │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ 6. Upload complete webhook
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UploadThing Service                          │
│  - Fires onUploadComplete callback                              │
│  - Provides file metadata (url, key, size, type)                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ 7. Save metadata to Convex
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Backend                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  submissions.saveSubmissionImage()                       │  │
│  │  - Validates submission ownership                        │  │
│  │  - Checks image count limit (max 3)                      │  │
│  │  - Stores: uploadthingUrl, uploadthingKey, fileKey      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:

- UploadThing acts as an abstraction layer over S3
- File data never touches Next.js server (direct client → S3)
- UploadThing handles presigned URL generation and webhook callbacks
- Convex stores metadata (URLs, keys, sizes) but not file blobs
- Images served via UploadThing CDN URLs (permanent, authenticated)

---

### 1. Database Schema Changes

**New Table**: `submissionImages`

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables ...

  submissionImages: defineTable({
    submissionId: v.id("submissions"),

    // UploadThing fields
    uploadthingUrl: v.string(), // Full CDN URL from UploadThing
    uploadthingKey: v.string(), // UploadThing file key (for deletion)
    fileKey: v.string(), // S3 object key (for direct S3 access if needed)

    // File metadata
    uploadedBy: v.id("users"),
    uploadedAt: v.string(), // ISO timestamp
    filename: v.string(), // Original filename
    contentType: v.string(), // MIME type (image/jpeg, etc.)
    size: v.number(), // File size in bytes

    // Display settings
    order: v.number(), // Display order (0, 1, 2)
  })
    .index("by_submission", ["submissionId"])
    .index("by_user", ["uploadedBy"])
    .index("by_uploadthing_key", ["uploadthingKey"]) // For deletion lookups
    .index("by_submission_and_order", ["submissionId", "order"]),
});
```

**Schema Differences from Spec 25**:

- Replaces `storageId: v.id("_storage")` with UploadThing fields
- `uploadthingUrl`: Permanent CDN URL (e.g., `https://utfs.io/f/abc123.jpg`)
- `uploadthingKey`: Unique key for UploadThing API operations (deletion)
- `fileKey`: S3 object key (for direct bucket access if migrating off UploadThing)

**Migration Strategy**:

- Table is additive (no changes to existing tables)
- Deploy schema with Convex push
- No data migration needed (new feature, no existing images)

---

### 2. Backend API Design (Convex)

#### Query: `getSubmissionImages`

```typescript
// convex/submissions.ts
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const getSubmissionImages = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Fetch submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Permission check: owner, team member, or admin
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

    // Fetch images
    const images = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    // Enrich with uploader info
    const imagesWithUploader = await Promise.all(
      images.map(async (img) => {
        const uploader = await ctx.db.get(img.uploadedBy);
        return {
          _id: img._id,
          url: img.uploadthingUrl, // UploadThing CDN URL
          filename: img.filename,
          contentType: img.contentType,
          size: img.size,
          uploadedAt: img.uploadedAt,
          uploaderName: uploader?.name || "Unknown",
          uploaderEmail: uploader?.email || "",
          order: img.order,
        };
      }),
    );

    // Sort by order
    return imagesWithUploader.sort((a, b) => a.order - b.order);
  },
});
```

**Key Differences from Spec 25**:

- No `ctx.storage.getUrl()` calls (UploadThing URLs are permanent)
- Returns `uploadthingUrl` directly (already a full CDN URL)
- Same permission logic as Spec 25

---

#### Mutation: `saveSubmissionImage`

```typescript
// convex/submissions.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const saveSubmissionImage = mutation({
  args: {
    submissionId: v.id("submissions"),
    uploadthingUrl: v.string(), // From onUploadComplete
    uploadthingKey: v.string(), // From onUploadComplete
    fileKey: v.string(), // From onUploadComplete
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // 1. Verify submission exists
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // 2. Check permission (owner or team member)
    if (submission.userId !== user._id) {
      if (submission.submissionType === "team") {
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (q) =>
            q.eq("teamId", submission.teamId).eq("userId", user._id),
          )
          .first();

        if (!membership) {
          throw new Error("Permission denied: not a team member");
        }
      } else {
        throw new Error("Permission denied: not submission owner");
      }
    }

    // 3. Cannot modify approved submissions
    if (submission.state === "approved") {
      throw new Error("Cannot add images to approved submissions");
    }

    // 4. Validate file type (server-side double-check)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(args.contentType.toLowerCase())) {
      throw new Error(
        `Invalid file type: ${args.contentType}. Only JPEG, PNG, WebP, and HEIC allowed.`,
      );
    }

    // 5. Validate size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (args.size > MAX_SIZE) {
      throw new Error(
        `Image exceeds 10MB limit (${(args.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    // 6. Check max image count (3)
    const existingImages = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    if (existingImages.length >= 3) {
      throw new Error("Maximum 3 images per submission");
    }

    // 7. Save metadata
    const imageId = await ctx.db.insert("submissionImages", {
      submissionId: args.submissionId,
      uploadthingUrl: args.uploadthingUrl,
      uploadthingKey: args.uploadthingKey,
      fileKey: args.fileKey,
      uploadedBy: user._id,
      uploadedAt: new Date().toISOString(),
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      order: args.order,
    });

    return imageId;
  },
});
```

**Validation Logic**:

- Same validation as Spec 25 (type, size, count limits)
- No storage cleanup needed (UploadThing handles file storage)
- Metadata saved after successful upload (called from `onUploadComplete`)

---

#### Mutation: `deleteSubmissionImage`

```typescript
// convex/submissions.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const deleteSubmissionImage = mutation({
  args: { imageId: v.id("submissionImages") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get image
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    // Get submission
    const submission = await ctx.db.get(image.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check permission (owner or admin)
    const isOwner = submission.userId === user._id;
    const isAdmin =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("tournament_manager");

    if (!isOwner && !isAdmin) {
      throw new Error("Permission denied");
    }

    // Cannot delete from approved submissions (unless admin)
    if (submission.state === "approved" && !isAdmin) {
      throw new Error("Cannot delete images from approved submissions");
    }

    // Delete metadata from Convex
    await ctx.db.delete(args.imageId);

    // Return uploadthingKey for client-side deletion
    // (UploadThing deletion must be done from client or via webhook)
    return {
      uploadthingKey: image.uploadthingKey,
    };
  },
});
```

**Deletion Flow**:

1. Client calls `deleteSubmissionImage` mutation
2. Mutation validates permissions and deletes Convex metadata
3. Mutation returns `uploadthingKey` to client
4. Client calls UploadThing's `deleteFiles()` API with the key
5. UploadThing deletes file from S3

**Note**: UploadThing doesn't provide a server-side Node.js SDK for file deletion, so deletion must be initiated from client or via webhook. For security, we validate permissions in Convex first, then allow client to delete from UploadThing.

---

#### Helper: `deleteSubmissionImages` (Cascade Delete)

```typescript
// convex/submissions.ts (internal helper)
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Delete all images associated with a submission
 * Called when submission is deleted
 * Returns array of uploadthingKeys for client-side cleanup
 */
async function deleteSubmissionImages(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
): Promise<string[]> {
  const images = await ctx.db
    .query("submissionImages")
    .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
    .collect();

  const uploadthingKeys = images.map((img) => img.uploadthingKey);

  // Delete metadata from Convex
  await Promise.all(
    images.map(async (img) => {
      await ctx.db.delete(img._id);
    }),
  );

  return uploadthingKeys;
}

// Update submissions.remove mutation:
export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: Delete associated images
    const uploadthingKeys = await deleteSubmissionImages(
      ctx,
      args.submissionId,
    );

    // ... rest of deletion logic ...

    // Return keys for client-side UploadThing cleanup
    return { uploadthingKeys };
  },
});
```

---

#### Update: `submissions.upsert` Validation

```typescript
// convex/submissions.ts
export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    // ... existing args ...
  },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: If transitioning to "pending", validate minimum image count
    if (args._id) {
      const existing = await ctx.db.get(args._id);

      // Only enforce for pending state (not for draft submissions)
      if (existing && existing.state === "pending") {
        const images = await ctx.db
          .query("submissionImages")
          .withIndex("by_submission", (q) => q.eq("submissionId", args._id!))
          .collect();

        if (images.length < 1) {
          throw new Error(
            "At least 1 image required. Please upload proof of activity before submitting.",
          );
        }
      }
    }

    // ... rest of existing logic ...
  },
});
```

---

### 3. UploadThing Configuration

#### File Router Setup

```typescript
// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

const f = createUploadthing();

/**
 * UploadThing File Router
 * Defines upload endpoints with validation and callbacks
 */
export const ourFileRouter = {
  /**
   * Route: submissionImageUploader
   * Purpose: Upload images for tournament submissions
   * Access: Authenticated users who own the submission or are team members
   */
  submissionImageUploader: f({
    image: {
      maxFileSize: "10MB",
      maxFileCount: 3,
    },
  })
    // Middleware: Validate authentication and permissions
    .middleware(async ({ req, files }) => {
      // 1. Check Clerk authentication
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) {
        throw new UploadThingError("Unauthorized: Please sign in");
      }

      // 2. Extract submissionId from request metadata
      // (Passed from client via useUploadThing hook)
      const submissionId = req.headers.get(
        "x-submission-id",
      ) as Id<"submissions"> | null;
      if (!submissionId) {
        throw new UploadThingError("Missing submission ID");
      }

      // 3. Fetch Convex user from Clerk ID
      const user = await fetchQuery(api.users.getByExternalId, {
        externalId: clerkUserId,
      });
      if (!user) {
        throw new UploadThingError("User not found in database");
      }

      // 4. Verify submission exists and check permissions
      const submission = await fetchQuery(api.submissions.get, {
        submissionId,
      });
      if (!submission) {
        throw new UploadThingError("Submission not found");
      }

      // 5. Permission check: owner or team member
      if (submission.userId !== user._id) {
        if (submission.submissionType === "team") {
          // Check team membership
          const membership = await fetchQuery(api.teams.getMembership, {
            teamId: submission.teamId,
            userId: user._id,
          });
          if (!membership) {
            throw new UploadThingError("Permission denied: not a team member");
          }
        } else {
          throw new UploadThingError("Permission denied: not submission owner");
        }
      }

      // 6. Check submission state (cannot upload to approved submissions)
      if (submission.state === "approved") {
        throw new UploadThingError(
          "Cannot upload images to approved submissions",
        );
      }

      // 7. Check existing image count
      const existingImages = await fetchQuery(
        api.submissions.getSubmissionImages,
        {
          submissionId,
        },
      );
      if (existingImages.length + files.length > 3) {
        throw new UploadThingError(
          `Cannot upload ${files.length} images. Maximum 3 images per submission (${existingImages.length} already uploaded)`,
        );
      }

      // Pass metadata to onUploadComplete
      return {
        userId: user._id,
        submissionId,
        clerkUserId,
      };
    })

    // Callback: Save metadata to Convex after successful upload
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File key:", file.key);

      // Save image metadata to Convex
      try {
        // Determine order based on existing images
        const existingImages = await fetchQuery(
          api.submissions.getSubmissionImages,
          {
            submissionId: metadata.submissionId,
          },
        );
        const order = existingImages.length;

        await fetchMutation(api.submissions.saveSubmissionImage, {
          submissionId: metadata.submissionId,
          uploadthingUrl: file.url,
          uploadthingKey: file.key,
          fileKey: file.key, // UploadThing key is the S3 object key
          filename: file.name,
          contentType: file.type,
          size: file.size,
          order,
        });

        console.log("Image metadata saved to Convex");
      } catch (error) {
        console.error("Failed to save image metadata:", error);
        throw new UploadThingError("Failed to save image metadata");
      }

      // Return value available to client in onClientUploadComplete
      return {
        uploadedBy: metadata.userId,
        submissionId: metadata.submissionId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

**Key Features**:

- **Type Safety**: `FileRouter` type ensures type inference for client
- **Middleware**: Validates auth, permissions, and business rules before upload
- **onUploadComplete**: Saves metadata to Convex after S3 upload succeeds
- **Error Handling**: Throws `UploadThingError` for client-friendly errors
- **Metadata Passing**: Middleware passes context to `onUploadComplete`

---

#### API Route Handler

```typescript
// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

/**
 * Next.js API route for UploadThing
 * Handles GET and POST requests from UploadThing client
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,

  // Optional: Configure UploadThing options
  config: {
    uploadthingId: process.env.UPLOADTHING_APP_ID,
    uploadthingSecret: process.env.UPLOADTHING_SECRET,
  },
});
```

**Deployment Notes**:

- This route must be deployed at `/api/uploadthing` (UploadThing convention)
- Handles both GET (metadata) and POST (upload URL generation) requests
- Environment variables must be set (see Migration section)

---

#### Client Utilities

```typescript
// src/lib/uploadthing.ts
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

/**
 * Type-safe UploadThing client helpers
 * Auto-generates hooks with correct types from file router
 */
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
```

**Type Inference**:

- `useUploadThing("submissionImageUploader")` auto-completes route name
- Hook return types inferred from `FileRouter` definition
- Compile-time errors if route doesn't exist

---

### 4. Frontend Implementation

#### Image Uploader Component

```typescript
// src/components/submissions/ImageUploader.tsx
"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/../convex/_generated/dataModel";

interface ImageUploaderProps {
  submissionId: Id<"submissions">;
  existingImages: Array<{
    _id: string;
    url: string;
    filename: string;
  }>;
  onUploadComplete?: () => void;
  onImageDelete?: (imageId: string) => void;
  disabled?: boolean;
}

export function ImageUploader({
  submissionId,
  existingImages,
  onUploadComplete,
  onImageDelete,
  disabled = false,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing(
    "submissionImageUploader",
    {
      onClientUploadComplete: (res) => {
        console.log("Upload complete:", res);
        toast.success(`${res.length} image(s) uploaded successfully`);
        setFiles([]);
        setProgress(0);
        setUploading(false);
        onUploadComplete?.();
      },
      onUploadError: (error) => {
        console.error("Upload error:", error);
        toast.error(error.message || "Upload failed");
        setUploading(false);
        setProgress(0);
      },
      onUploadProgress: (p) => {
        console.log("Upload progress:", p);
        setProgress(p);
      },
    },
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Client-side validation
    const maxCount = 3 - existingImages.length;
    if (selectedFiles.length > maxCount) {
      toast.error(`Maximum ${maxCount} more image(s) allowed`);
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and HEIC allowed.`);
        return false;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return false;
      }

      return true;
    });

    setFiles(validFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      await startUpload(files, {
        headers: {
          "x-submission-id": submissionId,
        },
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canUploadMore = existingImages.length + files.length < 3;

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingImages.map((img) => (
            <div key={img._id} className="relative group">
              <img
                src={img.url}
                alt={img.filename}
                className="aspect-square w-full rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={() => onImageDelete?.(img._id)}
                disabled={disabled}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Selection */}
      {canUploadMore && !disabled && (
        <div className="space-y-3">
          <label
            htmlFor="image-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-gray-400 hover:bg-gray-100"
          >
            <ImageIcon className="mb-2 h-10 w-10 text-gray-400" />
            <span className="text-gray-600 text-sm">
              Click to select images
            </span>
            <span className="mt-1 text-gray-400 text-xs">
              JPEG, PNG, WebP, HEIC (max 10MB each)
            </span>
            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled || uploading}
            />
          </label>

          {/* Selected Files Preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">
                Selected files ({files.length}):
              </p>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                  >
                    <span className="truncate text-sm">{file.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)}MB
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading... {progress}%
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length} Image{files.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {uploading && <Progress value={progress} className="w-full" />}
            </div>
          )}
        </div>
      )}

      {/* Image Count Info */}
      <p className="text-muted-foreground text-xs">
        {existingImages.length} / 3 images uploaded
        {existingImages.length === 0 && (
          <span className="text-orange-600"> (minimum 1 required)</span>
        )}
      </p>
    </div>
  );
}
```

**Component Features**:

- Drag-and-drop support (via native file input)
- Real-time validation (type, size, count)
- Progress tracking with percentage
- Thumbnail preview of selected files
- Individual file removal before upload
- Existing image display with delete option
- Disabled state support (for approved submissions)

---

#### Integration with Submission Form

```typescript
// src/components/form/upsert-submission-form.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { ImageUploader } from "@/components/submissions/ImageUploader";
import { deleteFiles } from "uploadthing/client";
import { toast } from "sonner";

// ... existing imports and form setup ...

export function UpsertSubmissionFormDialog({
  submission,
  // ... other props ...
}: Props) {
  const [submissionId, setSubmissionId] = useState(submission?._id);

  // Fetch existing images
  const images = useQuery(
    api.submissions.getSubmissionImages,
    submissionId ? { submissionId } : "skip",
  );

  const deleteImage = useMutation(api.submissions.deleteSubmissionImage);

  const handleImageDelete = async (imageId: string) => {
    try {
      // Delete from Convex (returns uploadthingKey)
      const result = await deleteImage({ imageId });

      // Delete from UploadThing/S3
      await deleteFiles([result.uploadthingKey]);

      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("Failed to delete image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form id={formId} onSubmit={form.handleSubmit}>
        {/* ... existing dialog content ... */}

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {submission ? "Edit Submission" : "Create Submission"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            {/* ... existing form fields ... */}

            {/* NEW: Image Upload Section */}
            {submissionId && (
              <div className="space-y-2">
                <label className="font-medium text-sm">
                  Activity Images
                  <span className="text-red-500"> *</span>
                </label>
                <ImageUploader
                  submissionId={submissionId}
                  existingImages={images || []}
                  onUploadComplete={() => {
                    // Refetch images after upload
                    // (Convex auto-updates via reactive queries)
                  }}
                  onImageDelete={handleImageDelete}
                  disabled={submission?.state === "approved"}
                />
              </div>
            )}

            {/* Show message if submission not yet created */}
            {!submissionId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-blue-800 text-sm">
                  Save your submission details first, then you can upload images.
                </p>
              </div>
            )}
          </FieldGroup>

          {/* ... existing dialog footer ... */}
        </DialogContent>
      </form>
    </Dialog>
  );
}
```

**Integration Points**:

- Form creates submission first (draft state)
- After creation, `submissionId` becomes available
- Image uploader enables once submission exists
- Approved submissions disable image upload/delete
- Convex reactive queries auto-update image list

---

### 5. Validation Rules

#### File Type Validation

**Allowed MIME Types**:

```typescript
const allowedTypes = [
  "image/jpeg",
  "image/jpg", // Some browsers send jpg instead of jpeg
  "image/png",
  "image/webp",
  "image/heic",
];
```

**Client-Side** (early feedback):

```typescript
// In ImageUploader component
if (!allowedTypes.includes(file.type.toLowerCase())) {
  toast.error(`Invalid file type: ${file.name}`);
  return false;
}
```

**Server-Side** (UploadThing config):

```typescript
// In file router
f({
  image: {
    maxFileSize: "10MB",
    maxFileCount: 3,
  },
});
```

**Server-Side** (Convex double-check):

```typescript
// In saveSubmissionImage mutation
if (!allowedTypes.includes(args.contentType.toLowerCase())) {
  throw new Error(`Invalid file type: ${args.contentType}`);
}
```

---

#### File Size Validation

**Limits**:

- Per-image: 10MB max
- Total submission: 25MB max (3 × 10MB with overhead)

**Client-Side**:

```typescript
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  toast.error(`${file.name} exceeds 10MB limit`);
  return false;
}
```

**Server-Side** (UploadThing):

```typescript
f({
  image: {
    maxFileSize: "10MB",
  },
});
```

**Server-Side** (Convex):

```typescript
const MAX_SIZE = 10 * 1024 * 1024;
if (args.size > MAX_SIZE) {
  throw new Error(`Image exceeds 10MB limit`);
}
```

---

#### Count Validation

**Limits**:

- Minimum: 1 image (enforced when moving to "pending")
- Maximum: 3 images (enforced on upload)

**Client-Side**:

```typescript
const maxCount = 3 - existingImages.length;
if (selectedFiles.length > maxCount) {
  toast.error(`Maximum ${maxCount} more image(s) allowed`);
  return;
}
```

**Server-Side** (UploadThing middleware):

```typescript
if (existingImages.length + files.length > 3) {
  throw new UploadThingError("Maximum 3 images per submission");
}
```

**Server-Side** (Convex):

```typescript
const existingImages = await ctx.db
  .query("submissionImages")
  .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
  .collect();

if (existingImages.length >= 3) {
  throw new Error("Maximum 3 images per submission");
}
```

---

### 6. Error Handling

#### Upload Errors

**Network Failure**:

```typescript
// UploadThing auto-retries failed uploads (3 attempts)
// Client handles via onUploadError callback
onUploadError: (error) => {
  if (error.message.includes("network")) {
    toast.error("Network error. Please check your connection and try again.");
  } else {
    toast.error(error.message || "Upload failed");
  }
};
```

**File Too Large**:

```typescript
// Client-side (immediate feedback)
if (file.size > 10 * 1024 * 1024) {
  toast.error(
    `${file.name} exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
  );
}

// Server-side (UploadThing rejects)
// Error: "File size exceeds maximum allowed size"
```

**Invalid File Type**:

```typescript
// Client-side
if (!allowedTypes.includes(file.type)) {
  toast.error(
    `Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and HEIC allowed.`,
  );
}

// Server-side (UploadThing rejects)
// Error: "File type not allowed"
```

**Maximum Count Exceeded**:

```typescript
// Middleware check
if (existingImages.length + files.length > 3) {
  throw new UploadThingError(
    `Cannot upload ${files.length} images. Maximum 3 images per submission`,
  );
}
```

---

#### Permission Errors

**Unauthorized**:

```typescript
// Middleware throws before upload starts
if (!clerkUserId) {
  throw new UploadThingError("Unauthorized: Please sign in");
}
```

**Not Submission Owner**:

```typescript
if (submission.userId !== user._id && !isTeamMember) {
  throw new UploadThingError("Permission denied: not submission owner");
}
```

**Approved Submission**:

```typescript
if (submission.state === "approved") {
  throw new UploadThingError("Cannot upload images to approved submissions");
}
```

---

#### Deletion Errors

**Image Not Found**:

```typescript
const image = await ctx.db.get(args.imageId);
if (!image) {
  throw new Error("Image not found");
}
```

**Permission Denied**:

```typescript
if (!isOwner && !isAdmin) {
  throw new Error("Permission denied");
}
```

**UploadThing Deletion Failure**:

```typescript
// Client-side deletion
try {
  await deleteFiles([uploadthingKey]);
} catch (error) {
  console.error("UploadThing deletion failed:", error);
  toast.error("Failed to delete image from storage");
}
```

---

### 7. Security Considerations

#### Authentication & Authorization

**UploadThing Middleware**:

- Validates Clerk session before generating upload URL
- Checks submission ownership or team membership
- Prevents unauthorized uploads to other users' submissions

**Convex Mutations**:

- All mutations use `getCurrentUserOrThrow()`
- Double-checks permissions (defense in depth)
- Validates submission state (cannot modify approved)

**Upload URL Expiration**:

- UploadThing presigned URLs expire in 1 hour
- Old URLs cannot be reused after expiration

---

#### File Validation

**MIME Type Checking**:

- Client validates `file.type` (early feedback)
- UploadThing validates during upload (file router config)
- Convex validates `contentType` on save (defense in depth)

**Size Validation**:

- Client: Early feedback before upload
- UploadThing: Rejects oversized files during upload
- Convex: Validates on metadata save

**Content Validation** (Future Enhancement):

- UploadThing supports custom file validators
- Could add image dimension checks (min/max resolution)
- Could integrate virus scanning (UploadThing + external service)

---

#### Storage Security

**S3 Bucket Configuration**:

- Bucket is private (no public read access)
- Files served via UploadThing CDN URLs
- UploadThing handles signed URL generation

**File Keys**:

- UploadThing generates unique, non-guessable keys
- Keys stored in Convex for deletion operations
- Direct S3 access blocked (only via UploadThing)

**Sensitive Data**:

- No EXIF GPS data stored in metadata (privacy)
- Filenames sanitized to prevent XSS (future enhancement)
- No personally identifiable info in file keys

---

### 8. Performance Optimizations

#### Upload Performance

**Parallel Uploads**:

```typescript
// UploadThing handles multiple files in parallel
await startUpload([file1, file2, file3]);
// Uploads happen concurrently, not sequentially
```

**Progress Tracking**:

```typescript
onUploadProgress: (p) => {
  setProgress(p); // 0-100
  // Show real-time progress bar
};
```

**Chunked Uploads**:

- UploadThing automatically chunks large files (>5MB)
- Improves reliability on slow connections
- Supports resumable uploads (future enhancement)

---

#### Image Delivery Performance

**CDN Delivery**:

- UploadThing serves files via CDN (low latency)
- Global edge locations (fast worldwide)
- Auto-scaled for traffic spikes

**Lazy Loading**:

```typescript
// In SubmissionCardImage component
<Image
  src={img.url}
  loading="lazy"  // Native browser lazy loading
  className="..."
/>
```

**Image Optimization** (Future Enhancement):

```typescript
// UploadThing supports automatic image transformations
// Example: Resize, compress, convert format
// URL: https://utfs.io/f/abc123.jpg?width=800&quality=80
```

---

#### Database Performance

**Indexes**:

```typescript
.index("by_submission", ["submissionId"])        // Fast image lookups
.index("by_uploadthing_key", ["uploadthingKey"]) // Fast deletion lookups
.index("by_submission_and_order", ["submissionId", "order"]) // Sorted queries
```

**Query Optimization**:

```typescript
// Fetch images only when needed (not on every submission list view)
const images = useQuery(
  api.submissions.getSubmissionImages,
  submissionId ? { submissionId } : "skip", // Skip if no submissionId
);
```

---

### 9. Testing Strategy

#### Unit Tests

**Convex Mutations** (using Convex test framework):

```typescript
// Test saveSubmissionImage validation
test("rejects invalid file types", async () => {
  await expect(
    saveSubmissionImage({
      submissionId: "test-id",
      contentType: "application/pdf", // Invalid
      // ... other args
    }),
  ).rejects.toThrow("Invalid file type");
});

test("enforces 3 image limit", async () => {
  // Create submission with 3 images
  // Attempt to upload 4th
  await expect(saveSubmissionImage(/* ... */)).rejects.toThrow(
    "Maximum 3 images",
  );
});
```

**UploadThing Middleware** (integration tests):

```typescript
// Test authentication check
test("rejects unauthenticated uploads", async () => {
  // Mock Clerk auth to return null
  // Attempt upload
  // Expect UploadThingError
});

test("rejects uploads to other user's submissions", async () => {
  // Create submission as User A
  // Try to upload as User B
  // Expect permission error
});
```

---

#### Integration Tests

**Upload Flow** (E2E with Playwright):

```typescript
test("user uploads submission image", async ({ page }) => {
  // 1. Navigate to submission form
  await page.goto("/submissions/new");

  // 2. Create submission (draft)
  await page.fill('input[name="description"]', "Test submission");
  await page.click('button[type="submit"]');

  // 3. Upload image
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles("test-image.jpg");
  await page.click('button:has-text("Upload")');

  // 4. Verify image appears
  await expect(page.locator('img[alt="test-image.jpg"]')).toBeVisible();

  // 5. Verify count
  await expect(page.locator('text="1 / 3 images uploaded"')).toBeVisible();
});
```

**Deletion Flow**:

```typescript
test("user deletes submission image", async ({ page }) => {
  // Setup: Submission with 1 image
  // Click delete button
  // Confirm deletion
  // Verify image removed
  // Verify count updated
});
```

---

#### Manual Testing Scenarios

1. **Happy Path**:
   - Create submission
   - Upload 1-3 images (JPEG, PNG, WebP)
   - View images in card view
   - Open lightbox, navigate between images
   - Submit for approval

2. **Validation Errors**:
   - Try uploading 4th image (expect error)
   - Try uploading 15MB file (expect error)
   - Try uploading PDF (expect error)
   - Try uploading to approved submission (expect error)

3. **Permission Checks**:
   - User A creates submission
   - User B tries to upload (expect error unless team member)
   - Admin can view all images

4. **Network Issues**:
   - Start upload, disable network mid-transfer
   - Expect retry or clear error message
   - Re-enable network, retry upload

5. **Edge Cases**:
   - Upload image with special characters in filename
   - Upload HEIC image from iPhone
   - Delete submission with 3 images (verify cascade)
   - Team submission: multiple members upload images

---

## Implementation Plan

### Phase 1: Foundation (Day 1)

**Tasks**:

1. Install UploadThing dependencies

   ```bash
   bun add uploadthing @uploadthing/react
   ```

2. Set up environment variables

   ```bash
   # .env.local
   UPLOADTHING_SECRET=sk_live_...
   UPLOADTHING_APP_ID=app_...
   ```

3. Deploy Convex schema changes

   ```bash
   bunx convex dev
   # Schema auto-deploys on save
   ```

4. Create UploadThing file router (`app/api/uploadthing/core.ts`)
5. Create API route handler (`app/api/uploadthing/route.ts`)
6. Create client utilities (`src/lib/uploadthing.ts`)

**Deliverables**:

- Schema deployed to Convex
- UploadThing configured and tested (basic upload works)
- Type generation verified (client sees route types)

---

### Phase 2: Backend Logic (Day 1-2)

**Tasks**:

1. Implement `saveSubmissionImage` mutation (Convex)
2. Implement `getSubmissionImages` query (Convex)
3. Implement `deleteSubmissionImage` mutation (Convex)
4. Update `submissions.upsert` with image count validation
5. Update `submissions.remove` with cascade delete helper
6. Add middleware logic to UploadThing file router (auth, permissions)
7. Implement `onUploadComplete` callback in file router

**Testing**:

- Test mutations with Convex dashboard
- Test file router with mock uploads
- Verify permission checks (try unauthorized access)
- Test cascade delete (delete submission with images)

**Deliverables**:

- All backend mutations working
- UploadThing integration complete
- Permission checks verified

---

### Phase 3: User Interface (Day 2)

**Tasks**:

1. Create `ImageUploader` component
   - File selection UI
   - Validation feedback
   - Progress tracking
   - Existing image display
   - Delete functionality

2. Integrate `ImageUploader` into `UpsertSubmissionForm`
   - Conditional rendering (only after submission created)
   - Hook up deletion handler
   - Handle upload complete callback

3. Verify `SubmissionCardImage` component works with new URLs
   - Test with UploadThing CDN URLs
   - Verify lightbox functionality
   - Test lazy loading

**Testing**:

- Manual test full upload flow
- Test file validation (client-side)
- Test progress tracking
- Test image deletion
- Test on mobile (camera access)

**Deliverables**:

- Image uploader component complete
- Form integration working
- Card view displays images correctly

---

### Phase 4: Polish & Testing (Day 3)

**Tasks**:

1. Add loading states
   - Skeleton loaders for images
   - Disabled state during upload
   - Optimistic UI updates

2. Error handling improvements
   - Better error messages
   - Retry logic for failed uploads
   - Network error detection

3. Accessibility audit
   - Keyboard navigation
   - Screen reader labels
   - Focus management

4. Mobile testing
   - Camera integration
   - Touch gestures
   - Responsive layouts

5. Write documentation
   - Update CLAUDE.md with UploadThing patterns
   - Document environment variables
   - Add troubleshooting guide

**Testing**:

- Full regression test (all submission workflows)
- Accessibility testing (keyboard, screen reader)
- Mobile testing (iOS Safari, Android Chrome)
- Performance testing (3 concurrent uploads)

**Deliverables**:

- Production-ready feature
- Documentation complete
- All tests passing

---

## Migration & Deployment

### 1. UploadThing Account Setup

**Steps**:

1. Sign up at https://uploadthing.com
2. Create new app (name: "Urban Legends")
3. Select "S3-compatible storage" backend
4. Connect AWS S3 bucket or use UploadThing's managed S3

**AWS S3 Configuration** (if using own bucket):

```yaml
Bucket Name: urban-legends-submissions
Region: us-east-1
Access: Private (no public read)
CORS Configuration:
  - AllowedOrigins: ["https://your-app.com"]
    AllowedMethods: ["GET", "PUT", "POST", "DELETE"]
    AllowedHeaders: ["*"]
```

**UploadThing Dashboard**:

1. Copy API keys (secret + app ID)
2. Configure file size limits (10MB max)
3. Enable webhook for `onUploadComplete` (if needed)
4. Set up CDN domain (optional custom domain)

---

### 2. Environment Variables

**Add to `.env.local`**:

```bash
# UploadThing Configuration
UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxxxxxxxxxxx
UPLOADTHING_APP_ID=app_xxxxxxxxxxxxxxxxxxxxx

# Optional: Custom S3 bucket (if not using UploadThing's managed S3)
# UPLOADTHING_S3_BUCKET=urban-legends-submissions
# UPLOADTHING_S3_REGION=us-east-1
```

**Add to `.env.example`**:

```bash
# UploadThing File Upload Service
# Get these values from https://uploadthing.com/dashboard
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

**Vercel/Production**:

- Add environment variables in Vercel dashboard
- Mark `UPLOADTHING_SECRET` as sensitive (encrypted)
- Set variables for all environments (preview + production)

---

### 3. Dependencies

**Install**:

```bash
bun add uploadthing @uploadthing/react
```

**package.json** (expected versions):

```json
{
  "dependencies": {
    "uploadthing": "^7.4.0",
    "@uploadthing/react": "^7.4.0"
  }
}
```

**Peer Dependencies**:

- `react` (already installed: 19.1.0)
- `react-dom` (already installed: 19.1.0)

---

### 4. Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] UploadThing app configured (S3 bucket connected)
- [ ] Convex schema deployed (`bunx convex deploy`)
- [ ] Next.js API route deployed (`/api/uploadthing`)
- [ ] Test upload in production (staging environment first)
- [ ] Verify CDN delivery (check image URLs load)
- [ ] Monitor UploadThing dashboard for errors
- [ ] Set up rate limiting (UploadThing dashboard)
- [ ] Configure retention policy (delete orphaned files after 30 days)

---

## Code Examples

### Complete Upload Flow (E2E)

```typescript
// 1. USER SELECTS FILE
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    setFiles([file]);
  }}
/>

// 2. CLIENT STARTS UPLOAD
const { startUpload } = useUploadThing("submissionImageUploader", {
  onUploadComplete: (res) => {
    console.log("Upload complete:", res);
    // res[0] = { url, key, name, size, type }
  },
});

await startUpload([file], {
  headers: {
    "x-submission-id": submissionId, // Custom metadata
  },
});

// 3. UPLOADTHING MIDDLEWARE VALIDATES
.middleware(async ({ req, files }) => {
  const { userId } = await auth(); // Clerk
  if (!userId) throw new UploadThingError("Unauthorized");

  const submissionId = req.headers.get("x-submission-id");
  const submission = await fetchQuery(api.submissions.get, { submissionId });

  // Permission check
  if (submission.userId !== userId) {
    throw new UploadThingError("Permission denied");
  }

  return { userId, submissionId };
})

// 4. UPLOADTHING GENERATES PRESIGNED URL
// (Internal UploadThing process)
// Returns: { url: "https://s3.amazonaws.com/...", key: "abc123" }

// 5. CLIENT UPLOADS DIRECTLY TO S3
// (Handled by UploadThing SDK)
// Shows progress: 0% -> 100%

// 6. S3 CONFIRMS UPLOAD
// (Webhook to UploadThing)

// 7. UPLOADTHING FIRES CALLBACK
.onUploadComplete(async ({ metadata, file }) => {
  // file = { url, key, name, size, type }
  await fetchMutation(api.submissions.saveSubmissionImage, {
    submissionId: metadata.submissionId,
    uploadthingUrl: file.url,
    uploadthingKey: file.key,
    fileKey: file.key,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    order: 0,
  });
})

// 8. CONVEX SAVES METADATA
export const saveSubmissionImage = mutation({
  handler: async (ctx, args) => {
    // Validation
    if (args.size > 10 * 1024 * 1024) {
      throw new Error("File too large");
    }

    // Save to database
    const imageId = await ctx.db.insert("submissionImages", {
      submissionId: args.submissionId,
      uploadthingUrl: args.uploadthingUrl,
      uploadthingKey: args.uploadthingKey,
      // ... other fields
    });

    return imageId;
  },
});

// 9. CLIENT DISPLAYS IMAGE
const images = useQuery(api.submissions.getSubmissionImages, { submissionId });

{images?.map((img) => (
  <img key={img._id} src={img.url} alt={img.filename} />
))}
```

---

### Type Safety Example

```typescript
// File Router (Backend)
export const ourFileRouter = {
  submissionImageUploader: f({ image: { maxFileSize: "10MB" } })
    .middleware(async () => ({ userId: "user123" }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { success: true };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Client
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

// Usage (fully typed)
const { startUpload } = useUploadThing(
  "submissionImageUploader", // ✅ Autocomplete from file router
  // "invalidRoute",          // ❌ Type error: route doesn't exist
  {
    onUploadComplete: (res) => {
      // res is typed as Array<{
      //   url: string;
      //   key: string;
      //   name: string;
      //   size: number;
      //   type: string;
      // }>
      console.log(res[0].url); // ✅ Type-safe
      // console.log(res[0].invalid); // ❌ Type error
    },
  },
);
```

---

### Error Handling Example

```typescript
// Client component
const handleUpload = async () => {
  try {
    setUploading(true);

    const res = await startUpload(files, {
      headers: { "x-submission-id": submissionId },
    });

    if (!res) {
      throw new Error("Upload failed");
    }

    toast.success(`${res.length} image(s) uploaded`);
    setFiles([]);
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error) {
      // Specific error messages
      if (error.message.includes("Maximum 3 images")) {
        toast.error("Cannot upload more than 3 images per submission");
      } else if (error.message.includes("Permission denied")) {
        toast.error("You don't have permission to upload to this submission");
      } else if (error.message.includes("10MB")) {
        toast.error("One or more files exceed the 10MB limit");
      } else {
        toast.error(error.message || "Upload failed");
      }
    } else {
      toast.error("An unexpected error occurred");
    }
  } finally {
    setUploading(false);
  }
};
```

---

## Open Questions & Considerations

### 1. Image Compression

**Question**: Should we compress images before upload to reduce storage costs and improve performance?

**Options**:

- **Client-side compression**: Use browser-image-compression library (reduces upload time, saves bandwidth)
- **Server-side compression**: UploadThing supports automatic image optimization (resize, compress, convert)
- **No compression**: Accept images as-is (simpler implementation, higher quality)

**Recommendation**: Start without compression (simpler), add client-side compression in Phase 2 if storage costs become significant. UploadThing supports on-the-fly transformations via URL parameters (e.g., `?width=800&quality=80`).

---

### 2. HEIC Browser Support

**Question**: Safari uses HEIC for photos, but browser support for displaying HEIC is limited.

**Options**:

- **Accept and display as-is**: Works on Safari, may fail on Chrome/Firefox
- **Server-side conversion**: Convert HEIC to JPEG on upload (UploadThing + external service)
- **Client-side conversion**: Use heic2any library before upload

**Recommendation**: Accept HEIC uploads, add server-side conversion in Phase 2. UploadThing can integrate with image processing services (Cloudinary, Imgix) for automatic format conversion.

---

### 3. Orphaned File Cleanup

**Question**: What happens to files uploaded but never linked to submissions (e.g., user uploads, then abandons form)?

**Options**:

- **Background job**: Periodic cleanup of files older than 24 hours with no metadata (requires Convex cron job + UploadThing API)
- **TTL on uploads**: UploadThing auto-deletes files after N days if not confirmed (built-in feature)
- **Manual cleanup**: Admin dashboard to view/delete orphaned files

**Recommendation**: Use UploadThing's built-in TTL feature (set to 7 days). Files not confirmed via `onUploadComplete` are auto-deleted. For confirmed files, rely on cascade delete when submissions are removed.

---

### 4. Mobile Camera Quality

**Question**: Modern smartphones capture 12-20MB images, exceeding our 10MB limit.

**Options**:

- **Increase limit**: Raise to 20MB per image (higher storage costs)
- **Client-side compression**: Automatically compress images over 10MB before upload
- **User education**: Clear messaging about file size limits + suggestion to use lower quality setting

**Recommendation**: Implement client-side compression for files over 5MB (reduce to 80% quality). This balances quality and file size. Update limit to 20MB for uncompressed uploads (edge case for professional cameras).

---

### 5. CDN Performance

**Question**: Should we use a custom CDN domain for image delivery?

**Options**:

- **UploadThing default CDN**: `https://utfs.io/f/...` (free, automatic)
- **Custom domain**: `https://images.urbanlegends.com/...` (branded, requires DNS setup)
- **CloudFront integration**: Use AWS CloudFront with UploadThing's S3 bucket (lower latency for global users)

**Recommendation**: Start with UploadThing's default CDN (simplest). Migrate to custom CloudFront distribution if global latency becomes an issue (requires UploadThing Enterprise plan or direct S3 integration).

---

### 6. Image Moderation

**Question**: Should we implement AI-based image moderation to detect inappropriate content?

**Options**:

- **No moderation**: Trust users, rely on manual admin review
- **AI moderation**: Integrate AWS Rekognition or Google Cloud Vision API (flag explicit content, violence, etc.)
- **Hybrid**: AI flags suspicious images, admins manually review before approval

**Recommendation**: Start without AI moderation (Phase 1). Add AI moderation in Phase 2 if abuse becomes a problem. UploadThing supports webhook integration with moderation services.

---

## Success Metrics

### Functional Metrics

- **Upload Success Rate**: >95% of uploads complete successfully
- **Validation Accuracy**: 100% of invalid files rejected (type/size)
- **Permission Enforcement**: 0 unauthorized uploads succeed
- **Cascade Delete Success**: 100% of submission deletions clean up images

### Performance Metrics

- **Average Upload Time**: <10 seconds for 5MB image (95th percentile)
- **Time to First Byte (Image Viewing)**: <200ms (95th percentile)
- **CDN Cache Hit Rate**: >90% (images served from edge, not origin)
- **Parallel Upload Throughput**: 3 images upload in <15 seconds combined

### User Experience Metrics

- **Error Rate**: <5% of upload attempts fail (excluding user errors like wrong file type)
- **Retry Success Rate**: >80% of failed uploads succeed on retry
- **Mobile Upload Success**: >90% success rate on iOS/Android (camera integration)

### Business Metrics

- **Submission Completion Rate**: >80% of submissions include at least 1 image (after enforcement)
- **Image Quality**: Average image size 3-5MB (compressed but high-quality)
- **Storage Efficiency**: <100GB total storage in first 3 months (assuming 500 submissions × 2 images × 5MB avg)

---

## Appendix: Technical Decisions

### Why UploadThing Over Convex Storage?

**Advantages of UploadThing**:

1. **Type Safety**: End-to-end type inference from backend to frontend
2. **S3 Compatibility**: Future-proof (easy to migrate to direct S3 if needed)
3. **Better Developer Experience**: Presigned URLs, progress tracking, and webhooks out of the box
4. **Scalability**: Built on S3 (proven for billions of files)
5. **CDN Delivery**: Automatic global CDN with low latency
6. **File Transformations**: Built-in support for image resize/compress (future enhancement)

**Trade-offs**:

1. **Additional Service**: One more service to manage (UploadThing account)
2. **Cost**: UploadThing has usage-based pricing (Convex storage is included in plan)
3. **Deletion Complexity**: UploadThing deletion requires client-side call (not server-side)

**Decision**: UploadThing's type safety and S3 compatibility outweigh the additional complexity. The developer experience improvement justifies the extra service dependency.

---

### Why S3 Over Direct Convex Storage?

**Advantages of S3**:

1. **Portability**: Easy to migrate storage providers without code changes (S3 API is standard)
2. **Cost Efficiency**: S3 storage costs ~$0.023/GB/month (cheaper at scale than Convex)
3. **Tooling**: Rich ecosystem (Cloudinary, Imgix, AWS services) integrates with S3
4. **Performance**: Global CDN options (CloudFront) with advanced caching

**Convex Storage Limitations**:

1. No CDN delivery (URLs expire, not cacheable)
2. Tighter coupling (harder to migrate off Convex if needed)
3. Limited file transformation options

**Decision**: S3 via UploadThing provides the best long-term scalability and flexibility while maintaining a good developer experience.

---

## Conclusion

This specification provides a complete implementation guide for submission image uploads using UploadThing with S3 backend. The solution balances:

- **Security**: Multi-layer validation, permission checks, authenticated uploads
- **Performance**: Direct-to-S3 uploads, CDN delivery, parallel processing
- **Developer Experience**: Type-safe APIs, clear error messages, reactive UI
- **User Experience**: Drag-and-drop, progress tracking, clear validation feedback
- **Scalability**: S3-backed storage, proven for billions of files

**Next Steps**:

1. Review this spec with team/stakeholders
2. Get UploadThing account approved (if budget required)
3. Begin Phase 1 implementation (foundation setup)
4. Deploy to staging environment for testing
5. Collect user feedback before production rollout

**Estimated Timeline**: 2-3 days for complete implementation (including testing and polish).
