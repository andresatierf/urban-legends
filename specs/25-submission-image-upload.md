# Spec 23: Submission Image Upload Backend

**Status**: Draft
**Created**: 2025-11-20
**Owner**: Andre
**Related**: Spec 24 (Card View Presentation)

## Overview

Implement backend infrastructure for mandatory image uploads on submissions. Users must upload 1-3 images per submission as proof of activity completion. Images are stored using Convex's file storage system with metadata tracking in a separate database table.

## Motivation

Tournament integrity requires visual proof that activities were actually completed. Without photographic evidence, submissions can be fraudulent or exaggerated. Image uploads provide:

- **Verification**: Visual proof that activities were completed
- **Trust**: Increases credibility of tournament results
- **Engagement**: Encourages genuine participation
- **Audit Trail**: Permanent record of submitted activities

## Goals

1. Store 1-3 images per submission using Convex file storage
2. Validate file types (JPEG, PNG, WebP, HEIC) and sizes (10MB per image)
3. Track image metadata (uploader, timestamp, filename, size)
4. Enforce minimum image requirement before submission can be approved
5. Cascade delete images when submissions are removed
6. Support image viewing for submission owners, team members, and admins
7. Provide secure, authenticated image URLs

## Non-Goals

- Image compression/optimization (future enhancement)
- Video uploads (future enhancement)
- Image editing/cropping (future enhancement)
- AI-based image moderation (future enhancement)
- EXIF data validation (future enhancement)
- Image watermarking (future enhancement)

## Technical Design

### 1. Database Schema

**New Table**: `submissionImages`

```typescript
// convex/schema.ts
submissionImages: defineTable({
  submissionId: v.id("submissions"),
  storageId: v.id("_storage"),      // Convex storage ID
  uploadedBy: v.id("users"),
  uploadedAt: v.string(),           // ISO timestamp
  filename: v.string(),             // Original filename
  contentType: v.string(),          // MIME type
  size: v.number(),                 // Bytes
  order: v.number(),                // Display order (0, 1, 2)
})
  .index("by_submission", ["submissionId"])
  .index("by_storage", ["storageId"])
  .index("by_user", ["uploadedBy"])
  .index("by_submission_and_order", ["submissionId", "order"]),
```

**Rationale**:

- Separate table allows multiple images per submission (1-to-many)
- Tracks who uploaded each image (important for team submissions)
- Order field controls display sequence
- Indexes optimize common queries

**Migration Strategy**:

- Table is additive (no changes to existing schema)
- Existing submissions without images continue to work
- No backfilling required

### 2. Backend Mutations

#### generateUploadUrl

```typescript
// convex/submissions.ts or convex/submissionImages.ts
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
```

**Purpose**: Generate temporary URL for client to upload file
**Access**: Any authenticated user
**Expiration**: URLs expire in 1 hour

#### saveImage

```typescript
export const saveImage = mutation({
  args: {
    submissionId: v.id("submissions"),
    storageId: v.id("_storage"),
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
          throw new Error("Permission denied");
        }
      } else {
        throw new Error("Permission denied");
      }
    }

    // 3. Cannot modify approved submissions
    if (submission.state === "approved") {
      throw new Error("Cannot add images to approved submissions");
    }

    // 4. Validate file from storage
    const fileMetadata = await ctx.db.system.get(args.storageId);
    if (!fileMetadata) {
      throw new Error("File not found in storage");
    }

    // 5. Validate content type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(fileMetadata.contentType || "")) {
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `Invalid file type: ${fileMetadata.contentType}. Only JPEG, PNG, WebP, and HEIC allowed.`,
      );
    }

    // 6. Validate size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileMetadata.size > MAX_SIZE) {
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `Image exceeds 10MB limit (${(fileMetadata.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    // 7. Check max image count (3)
    const existingImages = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    if (existingImages.length >= 3) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Maximum 3 images per submission");
    }

    // 8. Save metadata
    const imageId = await ctx.db.insert("submissionImages", {
      submissionId: args.submissionId,
      storageId: args.storageId,
      uploadedBy: user._id,
      uploadedAt: new Date().toISOString(),
      filename: args.filename,
      contentType: fileMetadata.contentType || args.contentType,
      size: fileMetadata.size,
      order: args.order,
    });

    return imageId;
  },
});
```

**Key Validations**:

- File type checked via MIME type (not extension)
- Size limit enforced (10MB per image)
- Max count enforced (3 images)
- Invalid files deleted from storage immediately
- Permission checks for submission ownership

#### deleteImage

```typescript
export const deleteImage = mutation({
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

    // Delete from storage
    await ctx.storage.delete(image.storageId);

    // Delete metadata
    await ctx.db.delete(args.imageId);
  },
});
```

**Cleanup**: Deletes both storage file AND database metadata

### 3. Backend Queries

#### getSubmissionImages

```typescript
export const getSubmissionImages = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check permission (owner, team member, or admin)
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

    // Get images
    const images = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    // Generate URLs and include uploader info
    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        const url = await ctx.storage.getUrl(img.storageId);
        const uploader = await ctx.db.get(img.uploadedBy);

        return {
          _id: img._id,
          url,
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
    return imagesWithUrls.sort((a, b) => a.order - b.order);
  },
});
```

**Access Control**: Owner, team members, or admins only
**URL Generation**: Uses `ctx.storage.getUrl()` for authenticated URLs
**Returns**: Images with URLs, metadata, and uploader info

### 4. Cascade Delete Helper

```typescript
/**
 * Delete all images associated with a submission
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

  await Promise.all(
    images.map(async (img) => {
      await ctx.storage.delete(img.storageId);
      await ctx.db.delete(img._id);
    }),
  );
}

// Update submissions.remove mutation:
export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: Delete associated images
    await deleteSubmissionImages(ctx, args.submissionId);

    // ... rest of deletion logic ...
  },
});
```

**Purpose**: Prevent orphaned files in storage

### 5. Validation in submissions.upsert

Update the existing `submissions.upsert` mutation to validate minimum image count:

```typescript
export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    // ... existing args ...
  },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: If submission already exists and is being finalized,
    // validate minimum image count
    if (args._id) {
      const existing = await ctx.db.get(args._id);

      if (existing && existing.state === "pending") {
        // Check image count for pending submissions
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
```

**Note**: This validation applies when moving submission to "pending" state

## Frontend Integration Points

### Upload Flow

```typescript
// 1. Generate upload URL
const uploadUrl = await generateUploadUrl();

// 2. Upload file to Convex storage
const response = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});

const { storageId } = await response.json();

// 3. Save metadata
await saveImage({
  submissionId: submission._id,
  storageId,
  filename: file.name,
  contentType: file.type,
  size: file.size,
  order: 0,
});
```

### Display Images

```typescript
// In React component
const images = useQuery(api.submissions.getSubmissionImages, {
  submissionId: submission._id,
});

// Render
{images?.map((img) => (
  <img key={img._id} src={img.url} alt={img.filename} />
))}
```

## Validation Rules

### File Type Validation

**Allowed MIME Types**:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/heic`

**Backend Validation**: Check `fileMetadata.contentType` from `ctx.db.system.get()`
**Frontend Validation**: Check `file.type` before upload (early feedback)

### File Size Validation

**Limits**:

- Per-image: 10MB max
- Total submission: 25MB max (3 images × 10MB, allowing overhead)

**Backend Validation**: Check `fileMetadata.size`
**Frontend Validation**: Check `file.size` before upload

### Count Validation

**Limits**:

- Minimum: 1 image (enforced when finalizing submission)
- Maximum: 3 images (enforced when uploading)

**Backend Validation**: Count existing images in `submissionImages` table

## Error Handling

### Invalid File Type

```
Error: Invalid file type: application/pdf. Only JPEG, PNG, WebP, and HEIC allowed.
```

**Action**: Delete file from storage, return error to client

### File Too Large

```
Error: Image exceeds 10MB limit (12.34MB)
```

**Action**: Delete file from storage, return error to client

### Maximum Count Exceeded

```
Error: Maximum 3 images per submission
```

**Action**: Delete file from storage, return error to client

### Permission Denied

```
Error: Permission denied
```

**Action**: Don't reveal whether submission exists (security)

### Missing Images on Submit

```
Error: Please upload at least 1 image as proof of activity before submitting
```

**Action**: Prevent submission state change, prompt user to upload

## Security Considerations

1. **Authentication**: All endpoints require `getCurrentUserOrThrow()`
2. **Authorization**: Permission checks for submission ownership/team membership
3. **File Validation**: Backend validates MIME type (not just extension)
4. **URL Security**: `ctx.storage.getUrl()` generates authenticated URLs
5. **Storage IDs**: Non-guessable Convex-generated IDs
6. **Cleanup**: Failed uploads deleted immediately to prevent storage bloat

## Performance Considerations

1. **Upload Parallelization**: Each image gets own upload URL (supports concurrent uploads)
2. **Query Optimization**: Indexes on `by_submission` for fast image lookups
3. **Lazy Loading**: Frontend fetches images per-card (not all at once)
4. **CDN Delivery**: Convex URLs are CDN-backed for fast serving
5. **Batch Deletes**: `deleteSubmissionImages` uses `Promise.all()` for parallel deletion

## Edge Cases

### Concurrent Uploads

- **Scenario**: User uploads 3 images simultaneously
- **Handling**: Each upload has own URL, count validated per-upload

### Submission Deleted During Upload

- **Scenario**: Submission deleted while image uploading
- **Handling**: `saveImage` fails with "Submission not found", file cleaned up

### Network Failure During Upload

- **Scenario**: Upload to storage succeeds, but `saveImage` fails
- **Handling**: File remains in storage but no metadata - orphaned
- **Mitigation**: Future cleanup job to remove orphaned files (Phase 2)

### Team Member Uploads to Individual Submission

- **Scenario**: Team member tries to upload to individual submission
- **Handling**: `saveImage` checks `submissionType === "team"`, denies access

### Admin Deletes Image from Approved Submission

- **Scenario**: Admin removes image from approved submission
- **Handling**: Allowed (admins have override permissions)

## Migration Plan

### Phase 1: Schema Deployment

- Deploy `submissionImages` table
- Deploy mutations and queries
- Test in development environment

### Phase 2: Backend Validation

- Update `submissions.upsert` with image count validation
- Update `submissions.remove` with cascade delete
- Deploy to production

### Phase 3: Frontend Integration

- Build upload components (see Spec 22)
- Update submission forms
- Deploy to production

### Phase 4: Enforcement

- Enable minimum image requirement
- Grandfather existing submissions (no backfill)

## Success Metrics

- 100% of new submissions include at least 1 image
- 0 orphaned files in storage (cascade delete works)
- Upload success rate > 95%
- Average upload time < 10 seconds for 5MB images
- Zero unauthorized image access (permission checks work)

## Open Questions

1. **Image Compression**: Should we compress images before storage?

   - **Recommendation**: Phase 2 feature (client-side compression)

2. **HEIC Browser Support**: Safari uses HEIC, but display support varies

   - **Recommendation**: Accept uploads, consider server-side conversion in Phase 2

3. **Orphaned File Cleanup**: How to handle files uploaded but never saved?

   - **Recommendation**: Background job to clean up files older than 24 hours with no metadata

4. **Mobile Camera Quality**: Modern phones capture 12-20MB images
   - **Recommendation**: Consider 20MB limit or client-side compression

## Dependencies

**Convex APIs**:

- `ctx.storage.generateUploadUrl()`
- `ctx.storage.getUrl(storageId)`
- `ctx.storage.delete(storageId)`
- `ctx.db.system.get(storageId)` (for file metadata)

**No New NPM Packages Required**
