# Feature Specification: Image Upload for Submissions

## Executive Summary

Add mandatory image upload functionality to the submission system to ensure tournament integrity by requiring visual proof of activity completion. Users will be required to upload 1-3 images when creating or editing submissions. Images will be stored using Convex's built-in file storage, displayed to admins during review, and viewable by team members.

**Primary User Benefit**: Prevents submission fraud by requiring photographic evidence of activity completion, increasing trust and competitiveness in tournaments.

**Business Value**: Enhances platform credibility, reduces admin disputes about submission validity, and improves user engagement through visual activity tracking.

**Complexity Estimate**: Medium (2-3 days of development)

---

## Feature Requirements

### Functional Requirements

**Image Upload Capabilities**:

- Users MUST upload between 1 and 3 images per submission (configurable minimum/maximum)
- Support standard image formats: JPEG, PNG, WebP, HEIC
- Maximum file size: 10MB per image
- Maximum total submission size: 25MB (for 3 images + overhead)
- Images can be uploaded via file picker or drag-and-drop
- Mobile users can capture photos directly using device camera
- Users can preview images before final submission
- Users can delete/replace images before submission is finalized

**Image Management**:

- Images are permanently associated with submissions (cannot be changed after approval)
- Pending submissions can have images edited/replaced
- Deleting a submission also deletes associated images from storage
- Rejected submissions retain images for audit trail but can be manually deleted by admins

**Admin Review Experience**:

- Admins see thumbnail grid of all images when reviewing submissions
- Clicking a thumbnail opens a full-size lightbox/modal view
- Lightbox supports keyboard navigation (arrow keys, ESC to close)
- Images display metadata: filename, size, upload timestamp
- Admins can zoom in on images for detail verification
- Image gallery shows which team member uploaded each image (for team submissions)

**Team Member Viewing**:

- Team members can view submission images in read-only mode
- Images appear on submission detail pages
- Submission calendar shows thumbnail indicator if images are present

**Validation & Error Handling**:

- Frontend validates file type before upload attempt
- Frontend validates file size before upload (prevent wasted bandwidth)
- Backend validates file content type (not just extension - check MIME type)
- Clear error messages for:
  - Invalid file types ("Only JPEG, PNG, WebP, and HEIC images are supported")
  - File too large ("Image exceeds 10MB limit. Please compress or resize.")
  - Total size exceeded ("Total upload size exceeds 25MB. Remove some images.")
  - Network failures during upload ("Upload failed. Please try again.")
  - Missing required images ("Please upload at least 1 image as proof of activity")
- Failed uploads are retryable without losing other form data
- Upload progress indicator for each image (0-100%)

**Edge Cases**:

- User navigates away during upload: Show confirmation dialog
- Network interruption during upload: Allow retry with same files
- Duplicate image uploads: Allow (no deduplication needed)
- Browser doesn't support drag-and-drop: Fallback to file picker only
- Image fails to load in viewer: Show placeholder with error message
- Legacy submissions without images: Display "No images uploaded" badge
- Mobile orientation changes during upload: Preserve upload state

### Non-Functional Requirements

**Performance**:

- Image uploads should complete in <10 seconds on typical connections (assuming <5MB images)
- Thumbnail generation happens on client-side before display (CSS resize)
- Admin review page loads in <2 seconds even with 50+ submissions
- Lightbox opens instantly (<200ms) with progressive image loading
- Lazy load images in data tables (only load visible rows)

**Security**:

- Only authenticated users can upload images
- Users can only upload images for their own submissions (or team submissions)
- Image URLs are authenticated (require Convex query to retrieve)
- File type validation on backend (check magic numbers, not just extension)
- No executable files allowed (double-check MIME types)
- Storage IDs are non-guessable (Convex-generated)

**Accessibility**:

- Image upload component is keyboard navigable
- Screen reader announces upload progress
- Alt text for images (auto-generated from submission description + date)
- High contrast mode support for upload UI
- Focus management in lightbox (trap focus, restore on close)

**Mobile Responsiveness**:

- Touch-friendly upload button (minimum 48x48px tap target)
- Camera integration on mobile (accept="image/\*" with capture attribute)
- Responsive image grid (1 column on mobile, 2-3 on desktop)
- Pinch-to-zoom support in lightbox on mobile
- Optimized upload for mobile networks (show estimated upload time)

---

## Technical Design

### Database Schema Changes

**New Table: `submissionImages`**

```typescript
submissionImages: defineTable({
  submissionId: v.id("submissions"),
  storageId: v.id("_storage"), // Convex storage ID
  uploadedBy: v.id("users"),
  uploadedAt: v.string(), // ISO timestamp
  filename: v.string(), // Original filename
  contentType: v.string(), // MIME type (image/jpeg, image/png, etc.)
  size: v.number(), // File size in bytes
  order: v.number(), // Display order (0, 1, 2)
})
  .index("by_submission", ["submissionId"])
  .index("by_storage", ["storageId"])
  .index("by_user", ["uploadedBy"])
  .index("by_submission_and_order", ["submissionId", "order"]),
```

**Rationale for Separate Table**:

- Allows multiple images per submission (1-to-many relationship)
- Easier to query/filter images independently
- Simplifies image deletion (just delete rows, not patching arrays)
- Better indexing for common queries (e.g., "all images for submission X")
- Audit trail: track who uploaded each image in team submissions

**Schema Migration Strategy**:

- New table is additive (no changes to existing `submissions` table)
- Existing submissions without images continue to work
- No backfilling required (old submissions simply have zero related images)
- Add validation in `submissions.upsert` mutation to check for minimum image count

### Backend API Design

#### **File Storage Functions**

**1. Generate Upload URL** (Mutation)

```typescript
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    // Verify user is authenticated
    const user = await getCurrentUserOrThrow(ctx);

    // Generate upload URL that expires in 1 hour
    return await ctx.storage.generateUploadUrl();
  },
});
```

**Authentication**: User must be authenticated (enforced by `getCurrentUserOrThrow`)

**Access Control**: Any authenticated user can generate upload URLs (submission ownership verified in `saveImage`)

---

**2. Save Image Metadata** (Mutation)

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

    // Verify submission exists and user has permission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check ownership: must be submission creator OR team member (for team submissions)
    if (submission.userId !== user._id) {
      // For team submissions, verify team membership
      if (submission.submissionType === "team") {
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (q) =>
            q.eq("teamId", submission.teamId).eq("userId", user._id),
          )
          .first();

        if (!membership) {
          throw new Error(
            "You don't have permission to upload images for this submission",
          );
        }
      } else {
        throw new Error(
          "You don't have permission to upload images for this submission",
        );
      }
    }

    // Verify submission is not approved (can't modify approved submissions)
    if (submission.state === "approved") {
      throw new Error("Cannot add images to approved submissions");
    }

    // Validate file metadata from storage
    const fileMetadata = await ctx.db.system.get(args.storageId);
    if (!fileMetadata) {
      throw new Error("File not found in storage");
    }

    // Validate content type (backend validation - don't trust client)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(fileMetadata.contentType || "")) {
      // Delete invalid file from storage
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `Invalid file type: ${fileMetadata.contentType}. Only JPEG, PNG, WebP, and HEIC are allowed.`,
      );
    }

    // Validate file size (10MB max per image)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileMetadata.size > MAX_IMAGE_SIZE) {
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `Image exceeds 10MB limit (size: ${(fileMetadata.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    // Check total submission image count (max 3)
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

    // Save image metadata
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

**Validation Strategy**:

- Use `ctx.db.system.get()` to verify file exists and retrieve actual metadata
- Check MIME type from storage (server-side validation)
- Delete files that fail validation to prevent storage bloat
- Enforce max image count and size limits

---

**3. Get Submission Images** (Query)

```typescript
export const getSubmissionImages = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Verify user has permission to view this submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check if user is owner, team member, or admin
    const isOwner = submission.userId === user._id;
    const isAdmin =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("tournament_manager");

    let isTeamMember = false;
    if (!isOwner && !isAdmin) {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", submission.teamId).eq("userId", user._id),
        )
        .first();
      isTeamMember = !!membership;
    }

    if (!isOwner && !isTeamMember && !isAdmin) {
      throw new Error("You don't have permission to view these images");
    }

    // Get images sorted by order
    const images = await ctx.db
      .query("submissionImages")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    // Generate URLs for each image and include uploader info
    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        const url = await ctx.storage.getUrl(img.storageId);
        const uploader = await ctx.db.get(img.uploadedBy);

        return {
          ...img,
          url, // URL for viewing image (expires, but regenerated on query)
          uploaderName: uploader?.name || "Unknown",
          uploaderEmail: uploader?.email || "",
        };
      }),
    );

    // Sort by order field
    return imagesWithUrls.sort((a, b) => a.order - b.order);
  },
});
```

**Access Control**: Only submission owner, team members, or admins can view images

**URL Generation**: Uses `ctx.storage.getUrl()` to generate authenticated URLs

---

**4. Delete Image** (Mutation)

```typescript
export const deleteImage = mutation({
  args: { imageId: v.id("submissionImages") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get image metadata
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    // Get associated submission
    const submission = await ctx.db.get(image.submissionId);
    if (!submission) {
      throw new Error("Associated submission not found");
    }

    // Only owner or admin can delete images
    const isOwner = submission.userId === user._id;
    const isAdmin =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("tournament_manager");

    if (!isOwner && !isAdmin) {
      throw new Error("You don't have permission to delete this image");
    }

    // Can't delete images from approved submissions (unless admin)
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

**Cleanup Strategy**: Deletes both storage file AND database metadata

**Access Control**: Only submission owner or admins can delete

---

**5. Update Submission Validation** (Modify existing `submissions.upsert`)

```typescript
// Add to existing submissions.upsert mutation
export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    date: v.string(),
    teamId: v.id("teams"),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
    submissionType: v.union(v.literal("individual"), v.literal("team")),
  },
  handler: async (ctx, args) => {
    // ... existing validation logic ...

    // NEW: Validate image count before allowing state change to "pending"
    // This validation only applies when submitting (not when auto-saving draft)
    const isNew = !args._id;

    if (!isNew) {
      // For existing submissions, check if moving from draft to pending
      const existingSubmission = await ctx.db.get(args._id);

      // If submission is already pending/approved/rejected, validate images
      if (existingSubmission && existingSubmission.state !== "pending") {
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
```

**Validation Timing**: Images must be present before submission can be finalized

**User Experience**: Allow draft submissions without images, but require images before "submit"

---

**6. Cascade Delete Images** (Helper function)

```typescript
/**
 * Helper function to delete all images associated with a submission
 * Called when a submission is deleted
 */
async function deleteSubmissionImages(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
): Promise<void> {
  const images = await ctx.db
    .query("submissionImages")
    .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
    .collect();

  // Delete from storage and database
  await Promise.all(
    images.map(async (img) => {
      await ctx.storage.delete(img.storageId);
      await ctx.db.delete(img._id);
    }),
  );
}

// Call from submissions.remove mutation:
export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    // ... existing validation ...

    // NEW: Delete associated images
    await deleteSubmissionImages(ctx, args.submissionId);

    // ... rest of existing logic ...
  },
});
```

**Cleanup Logic**: Ensure orphaned files don't accumulate in storage

---

### Frontend Architecture

#### **New Components**

**1. ImageUploader Component** (`src/components/submissions/image-uploader.tsx`)

```typescript
"use client";

import { useMutation } from "convex/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadItem {
  id: string; // Temporary ID for UI tracking
  file: File;
  preview: string; // Data URL for preview
  progress: number; // 0-100
  storageId?: Id<"_storage">;
  error?: string;
  uploaded: boolean;
}

interface ImageUploaderProps {
  submissionId: Id<"submissions">;
  existingImages?: Array<{
    _id: Id<"submissionImages">;
    url: string;
    filename: string;
  }>;
  maxImages?: number;
  minImages?: number;
  disabled?: boolean;
  onChange?: (imageIds: Id<"submissionImages">[]) => void;
}

export function ImageUploader({
  submissionId,
  existingImages = [],
  maxImages = 3,
  minImages = 1,
  disabled = false,
  onChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const generateUploadUrl = useMutation(api.submissions.generateUploadUrl);
  const saveImage = useMutation(api.submissions.saveImage);
  const deleteImage = useMutation(api.submissions.deleteImage);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, WebP, and HEIC images are supported";
    }

    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return `Image exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    return null;
  };

  const uploadImage = useCallback(async (file: File, order: number) => {
    // Validate file
    const error = validateFile(file);
    if (error) {
      return { error };
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    const tempId = Math.random().toString(36);

    // Add to UI
    const newImage: ImageUploadItem = {
      id: tempId,
      file,
      preview,
      progress: 0,
      uploaded: false,
    };

    setImages((prev) => [...prev, newImage]);

    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file with progress tracking
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();

      // Step 3: Save metadata
      const imageId = await saveImage({
        submissionId,
        storageId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        order,
      });

      // Update state
      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId
            ? { ...img, uploaded: true, progress: 100, storageId }
            : img
        )
      );

      onChange?.([...existingImages.map((i) => i._id), imageId]);

      return { success: true, imageId };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";

      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId ? { ...img, error: errorMsg } : img
        )
      );

      return { error: errorMsg };
    }
  }, [generateUploadUrl, saveImage, submissionId, existingImages, onChange]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const totalImages = images.length + existingImages.length;
    const remainingSlots = maxImages - totalImages;

    if (remainingSlots <= 0) {
      // Show error toast
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    filesToUpload.forEach((file, index) => {
      uploadImage(file, totalImages + index);
    });
  }, [images, existingImages, maxImages, uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDelete = async (imageId: Id<"submissionImages">) => {
    await deleteImage({ imageId });
    onChange?.(existingImages.filter((i) => i._id !== imageId).map((i) => i._id));
  };

  const canAddMore = images.length + existingImages.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
          !canAddMore && "opacity-50 cursor-not-allowed",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (canAddMore && !disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {minImages}-{maxImages} images required • Max 10MB per image • JPEG, PNG, WebP, HEIC
        </p>
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={!canAddMore || disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={!canAddMore || disabled}
        >
          Choose Files
        </Button>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {existingImages.map((img) => (
          <div key={img._id} className="relative group aspect-square rounded-lg overflow-hidden border">
            <img
              src={img.url}
              alt={img.filename}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(img._id)}
                disabled={disabled}
              >
                <X />
              </Button>
            </div>
          </div>
        ))}

        {images.map((img) => (
          <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border">
            <img
              src={img.preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {!img.uploaded && !img.error && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white">Uploading...</div>
              </div>
            )}
            {img.error && (
              <div className="absolute inset-0 bg-destructive/90 flex items-center justify-center p-2">
                <p className="text-destructive-foreground text-xs text-center">
                  {img.error}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Key Features**:

- Drag-and-drop support with visual feedback
- File validation before upload
- Preview images immediately
- Progress tracking per image
- Error handling with retry capability
- Responsive grid layout

---

**2. ImageGallery Component** (`src/components/submissions/image-gallery.tsx`)

```typescript
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../ui/button";

interface ImageGalleryProps {
  images: Array<{
    url: string;
    filename: string;
    uploaderName?: string;
    size?: number;
    uploadedAt?: string;
  }>;
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!lightboxOpen) return;

    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  // Add keyboard listener
  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">No images uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4", className)}>
        {images.map((img, index) => (
          <button
            key={index}
            type="button"
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all group"
          >
            <img
              src={img.url}
              alt={img.filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <div className="relative">
            {/* Main image */}
            <img
              src={images[currentIndex]?.url}
              alt={images[currentIndex]?.filename}
              className="w-full h-auto max-h-[70vh] object-contain"
            />

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={goToPrevious}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={goToNext}
                >
                  <ChevronRight />
                </Button>
              </>
            )}

            {/* Metadata */}
            <div className="mt-4 space-y-1 text-sm">
              <p className="font-medium">{images[currentIndex]?.filename}</p>
              {images[currentIndex]?.uploaderName && (
                <p className="text-muted-foreground">
                  Uploaded by: {images[currentIndex].uploaderName}
                </p>
              )}
              {images[currentIndex]?.size && (
                <p className="text-muted-foreground">
                  Size: {(images[currentIndex].size! / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* Counter */}
            {images.length > 1 && (
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Key Features**:

- Thumbnail grid with hover effects
- Full-screen lightbox modal
- Keyboard navigation (arrow keys, ESC)
- Image metadata display
- Responsive design

---

**3. Update Submission Form** (Modify `src/components/form/upsert-submission-form.tsx`)

```typescript
// Add to existing form
export function UpsertSubmissionFormDialog({ ... }) {
  // ... existing code ...

  return (
    <Dialog ...>
      <form ...>
        <DialogContent>
          {/* ... existing fields ... */}

          {/* NEW: Image upload section */}
          {submission?._id && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">
                Activity Photos *
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload 1-3 photos as proof of activity completion
              </p>
              <ImageUploader
                submissionId={submission._id}
                minImages={1}
                maxImages={3}
                disabled={form.state.isSubmitting || submission.state === "approved"}
              />
            </div>
          )}

          {/* Show note if creating new submission */}
          {!submission && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                You'll be able to upload photos after creating the submission
              </p>
            </div>
          )}

          {/* ... existing footer ... */}
        </DialogContent>
      </form>
    </Dialog>
  );
}
```

**User Flow**:

1. User creates submission (without images initially - draft state)
2. User is redirected to submission detail page
3. User uploads images using ImageUploader
4. User can edit description/tier
5. User "finalizes" submission (moves to pending state)
6. Backend validates minimum image count

---

**4. Update Submission Details Card** (Modify existing component)

```typescript
// Add images section to SubmissionDetailsCard
export function SubmissionDetailsCard({ data, ... }) {
  const images = useQuery(
    api.submissions.getSubmissionImages,
    data?.submission._id ? { submissionId: data.submission._id } : "skip"
  );

  return (
    <DetailsCard ...>
      {/* Existing details */}

      {/* NEW: Images section */}
      {images && images.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-3">Activity Photos</h3>
          <ImageGallery images={images} />
        </div>
      )}

      {images && images.length === 0 && data.submission.state === "pending" && (
        <div className="border-t pt-4 mt-4">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This submission is missing required photos. Please upload at least 1 image.
            </p>
          </div>
        </div>
      )}
    </DetailsCard>
  );
}
```

---

**5. Update Submission Data Table** (Add image indicator column)

```typescript
// Add column to submissions-data-table.tsx
const columns: ColumnDef<...>[] = [
  // ... existing columns ...
  {
    accessorKey: "hasImages",
    header: "Photos",
    cell: ({ row }) => {
      const submission = row.original;
      // This would require fetching image count - consider adding to submission doc
      return <ImageIcon className="h-4 w-4" />;
    },
  },
];
```

---

#### **Updated Routes**

**Modify existing routes** (no new routes needed):

- `/submissions/[submissionId]` - Display images in gallery
- `/submissions/[submissionId]/edit` - Allow image upload/management (if using separate edit page)

---

### Integration Points

**1. Submission Creation Flow**:

```
User clicks "Create Submission"
  → Form dialog opens
  → User fills form (without images)
  → User submits form
  → Submission created in "draft" state (no images required yet)
  → User redirected to submission detail page
  → User uploads images using ImageUploader
  → User clicks "Finalize Submission" button
  → Backend validates minimum image count
  → Submission state changes to "pending"
```

**2. Admin Review Flow**:

```
Admin navigates to submission review page
  → Submission list shows image indicator
  → Admin clicks submission row
  → Detail page shows ImageGallery
  → Admin clicks thumbnail to open lightbox
  → Admin reviews images in full-screen
  → Admin approves/rejects submission
```

**3. Team Member Viewing**:

```
Team member navigates to team submissions
  → Submission calendar shows submissions
  → Member clicks submission
  → Detail page shows read-only ImageGallery
```

**4. Submission Deletion**:

```
User/Admin deletes submission
  → submissions.remove mutation called
  → deleteSubmissionImages helper function runs
  → All images deleted from storage
  → All image metadata deleted from DB
```

---

## Implementation Plan

### Phase 1: Foundation (Day 1 - Morning)

**Database & Backend Setup**:

- [ ] Add `submissionImages` table to schema (`convex/schema.ts`)
- [ ] Create `generateUploadUrl` mutation
- [ ] Create `saveImage` mutation with validation
- [ ] Create `getSubmissionImages` query
- [ ] Create `deleteImage` mutation
- [ ] Add `deleteSubmissionImages` helper function
- [ ] Update `submissions.remove` to cascade delete images
- [ ] Test mutations using Convex dashboard

**Estimated Time**: 3-4 hours

---

### Phase 2: Business Logic (Day 1 - Afternoon)

**Validation & Authorization**:

- [ ] Add file type validation (MIME type checking)
- [ ] Add file size validation (per-image and total)
- [ ] Add maximum image count enforcement
- [ ] Add permission checks (ownership, team membership)
- [ ] Update `submissions.upsert` to validate image count before finalizing
- [ ] Test all validation edge cases

**Error Handling**:

- [ ] Handle invalid file types
- [ ] Handle oversized files
- [ ] Handle storage failures
- [ ] Handle network timeouts
- [ ] Clean up orphaned files on error

**Estimated Time**: 2-3 hours

---

### Phase 3: User Interface (Day 2 - Full Day)

**Image Upload Component**:

- [ ] Create `ImageUploader` component with drag-and-drop
- [ ] Implement file preview generation
- [ ] Add upload progress tracking
- [ ] Add error display and retry logic
- [ ] Add existing image display
- [ ] Add image deletion functionality
- [ ] Style for mobile responsiveness
- [ ] Test file picker, drag-and-drop, camera on mobile

**Image Gallery Component**:

- [ ] Create `ImageGallery` thumbnail grid
- [ ] Implement lightbox modal
- [ ] Add keyboard navigation (arrows, ESC)
- [ ] Add image metadata display
- [ ] Add responsive styling
- [ ] Test on various screen sizes

**Form Integration**:

- [ ] Update `UpsertSubmissionFormDialog` to include ImageUploader
- [ ] Add conditional rendering (show uploader only after submission created)
- [ ] Add validation messages
- [ ] Update submission flow (draft → upload images → finalize)

**Detail Page Integration**:

- [ ] Update `SubmissionDetailsCard` to query images
- [ ] Integrate `ImageGallery` component
- [ ] Add "missing images" warning for pending submissions
- [ ] Test with various image counts (0, 1, 3)

**Estimated Time**: 6-8 hours

---

### Phase 4: Polish & Testing (Day 3)

**Loading States & Error Boundaries**:

- [ ] Add skeleton loaders for image gallery
- [ ] Add retry buttons for failed uploads
- [ ] Add confirmation dialog before deleting images
- [ ] Add loading spinners during upload
- [ ] Handle edge case: user navigates away during upload

**Accessibility**:

- [ ] Add keyboard navigation to uploader
- [ ] Add ARIA labels to buttons
- [ ] Add screen reader announcements for upload progress
- [ ] Test with keyboard-only navigation
- [ ] Test with screen reader (NVDA/JAWS)

**Mobile Optimization**:

- [ ] Test camera integration on iOS/Android
- [ ] Test drag-and-drop on touch devices
- [ ] Test lightbox on mobile (pinch-to-zoom)
- [ ] Optimize upload for slow connections
- [ ] Add upload time estimates

**Manual Testing Scenarios**:

- [ ] Create submission → upload 1 image → finalize → verify
- [ ] Create submission → upload 3 images → finalize → verify
- [ ] Try to finalize submission with 0 images → expect error
- [ ] Upload 10MB image → expect success
- [ ] Upload 11MB image → expect error
- [ ] Upload PDF file → expect error
- [ ] Admin review: open lightbox → navigate with keyboard
- [ ] Delete submission → verify images deleted from storage
- [ ] Team submission: verify multiple members can view images
- [ ] Mobile: use camera to capture photo → upload → verify

**Documentation**:

- [ ] Update CLAUDE.md with image upload patterns
- [ ] Add code comments to complex functions
- [ ] Document image size limits in user-facing tooltips
- [ ] Create admin guide for image review workflow

**Estimated Time**: 4-6 hours

---

## Code Examples

### Full Upload Flow Example

**Frontend (React component)**:

```typescript
const handleUpload = async (file: File) => {
  // Step 1: Generate upload URL
  const uploadUrl = await generateUploadUrl();

  // Step 2: Upload file to Convex storage
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });

  const { storageId } = await response.json();

  // Step 3: Save metadata
  await saveImage({
    submissionId: submission._id,
    storageId,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    order: 0,
  });
};
```

---

### Backend Validation Example

```typescript
// In saveImage mutation
const fileMetadata = await ctx.db.system.get(args.storageId);

// Validate MIME type (check actual file, not just client claim)
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
if (!allowedTypes.includes(fileMetadata.contentType || "")) {
  await ctx.storage.delete(args.storageId); // Clean up
  throw new Error(`Invalid file type: ${fileMetadata.contentType}`);
}

// Validate size
const MAX_SIZE = 10 * 1024 * 1024;
if (fileMetadata.size > MAX_SIZE) {
  await ctx.storage.delete(args.storageId);
  throw new Error("File too large");
}
```

---

### Image Display Example

```typescript
// In React component
const images = useQuery(api.submissions.getSubmissionImages, {
  submissionId: submission._id,
});

return (
  <div className="grid grid-cols-3 gap-4">
    {images?.map((img) => (
      <img
        key={img._id}
        src={img.url}
        alt={img.filename}
        className="aspect-square object-cover rounded-lg"
      />
    ))}
  </div>
);
```

---

## Open Questions & Considerations

### Product Decisions Needed

1. **Minimum Image Count**: Should we require exactly 1 image minimum, or allow configurability per tournament?
   - **Recommendation**: Start with fixed minimum of 1 image, add tournament-level config later if needed

2. **Image Editing**: Should users be able to replace images after submission is pending?
   - **Recommendation**: No - images are locked once submission is pending. Users can delete and recreate submission if needed.

3. **Admin Image Actions**: Should admins be able to delete individual images from submissions?
   - **Recommendation**: Yes - admins should have full control for moderation purposes

4. **Legacy Submissions**: How to handle existing submissions without images?
   - **Recommendation**: Grandfather them in with a "No images uploaded" badge. Do not require backfilling.

5. **Image Compression**: Should we auto-compress images on upload?
   - **Recommendation**: Phase 2 feature. For v1, rely on file size limit to prevent huge uploads.

### Technical Considerations

1. **Storage Costs**: Convex storage pricing is based on GB stored. With 1000 submissions × 3 images × 5MB average = ~15GB per tournament.
   - **Mitigation**: Monitor storage usage, implement image compression in Phase 2

2. **Bandwidth**: Serving images directly from Convex may incur bandwidth costs at scale.
   - **Mitigation**: Use `ctx.storage.getUrl()` which returns Convex-hosted URLs (optimized for CDN delivery)

3. **Mobile Camera Quality**: Modern phones capture 12-20MB images by default.
   - **Mitigation**: 10MB limit may be too restrictive. Consider client-side compression or 20MB limit.

4. **HEIC Format**: Safari/iOS use HEIC by default, but browser support for display varies.
   - **Mitigation**: Accept HEIC uploads, but consider server-side conversion to JPEG in Phase 2

5. **Concurrent Uploads**: What happens if user uploads 3 images simultaneously?
   - **Mitigation**: Current design supports parallel uploads (each has own upload URL)

### Alternative Approaches Considered

1. **Store images as base64 in submission doc** (Rejected)
   - Pros: Simpler data model
   - Cons: Huge document size, poor query performance, no streaming

2. **Use third-party service (Cloudinary, Uploadcare)** (Rejected)
   - Pros: Advanced features (auto-optimization, transformations)
   - Cons: Additional cost, external dependency, complexity

3. **Store images in array field on submissions table** (Rejected)
   - Pros: Simpler schema (no join table)
   - Cons: Harder to query individual images, limits metadata tracking

4. **Single image per submission** (Rejected)
   - Pros: Simpler UI, less storage
   - Cons: Insufficient proof for complex activities (before/after shots, multiple angles)

---

## Success Metrics

### Feature Correctness

- [ ] 100% of new submissions include at least 1 image
- [ ] 0 orphaned files in storage (cleanup works correctly)
- [ ] 0 submissions bypass image requirement (validation works)
- [ ] Admins can view all images in lightbox with keyboard navigation

### Performance Benchmarks

- [ ] Image upload completes in <10 seconds for 5MB images on 4G connection
- [ ] Thumbnail grid loads in <2 seconds for 50 submission page
- [ ] Lightbox opens in <200ms
- [ ] No layout shift when images load (proper aspect ratio containers)

### User-Facing Validation

- [ ] Clear error messages for all validation failures
- [ ] Upload progress visible for files >1MB
- [ ] Drag-and-drop works on desktop browsers
- [ ] Camera access works on iOS and Android
- [ ] Keyboard navigation works in lightbox (arrows, ESC)

### Security

- [ ] Only authenticated users can upload images
- [ ] Users cannot upload images for other users' submissions
- [ ] File type validation prevents executable uploads
- [ ] Storage IDs cannot be guessed (Convex-generated)

---

## Migration & Rollout Strategy

### Gradual Rollout

**Phase 1: Soft Launch** (Week 1)

- Deploy image upload feature
- Existing submissions without images continue to work (grandfathered)
- New submissions show image uploader but DON'T enforce minimum yet
- Monitor for errors, storage costs, performance issues

**Phase 2: Enforcement** (Week 2)

- Enable minimum image validation for new submissions
- Show warning banners on old submissions without images
- Communicate change to users via email/announcement

**Phase 3: Full Deployment** (Week 3)

- Image upload is mandatory for all new submissions
- Old submissions remain grandfathered (no backfilling required)

### Rollback Plan

If critical issues arise:

1. Disable image validation in `submissions.upsert` (allow 0 images)
2. Hide ImageUploader component (feature flag or comment out)
3. Fix issues, re-deploy
4. Re-enable validation

**No data loss risk**: Images are stored separately, so disabling validation doesn't delete data.

---

## Future Enhancements (Not in Scope for v1)

1. **Image Compression**: Auto-compress images on client-side before upload (reduce storage costs)
2. **Image Cropping**: Allow users to crop images in-browser before upload
3. **Video Support**: Accept short video clips as proof (15-second max)
4. **AI Moderation**: Auto-flag inappropriate images for admin review
5. **Image Annotations**: Allow admins to draw on images during review (point out issues)
6. **Batch Upload**: Upload images for multiple submissions at once
7. **Tournament-Level Config**: Admin sets minimum/maximum image count per tournament
8. **Image Watermarking**: Add tournament name + date watermark to prevent image reuse
9. **EXIF Data Validation**: Verify photo timestamp matches submission date
10. **Storage Quota**: Per-team or per-tournament storage limits

---

## Dependencies

### NPM Packages (Already Installed)

- `convex` (^1.25.4) - File storage API
- `react` (19.1.0) - UI framework
- `zod` (^4.1.12) - Validation schemas
- `lucide-react` (^0.540.0) - Icons (Upload, Image, X, ChevronLeft, ChevronRight)
- `@radix-ui/react-dialog` (^1.1.15) - Lightbox modal

### New Dependencies Needed

- None! All requirements met with existing packages.

### Browser APIs Used

- `FileReader` API (image preview generation)
- `Drag and Drop` API (file upload)
- `fetch` API (upload to Convex)
- Media Capture API (mobile camera - via `<input accept="image/*" capture>`)

---

## Appendix: Convex File Storage Reference

### Key Concepts

**Storage IDs**: Unique identifiers for files (`Id<"_storage">`)

- Generated by Convex when file is uploaded
- Used to retrieve files via `ctx.storage.getUrl()` or `ctx.storage.get()`

**Upload URLs**: Temporary URLs for direct client-to-storage uploads

- Generated via `ctx.storage.generateUploadUrl()`
- Expire after 1 hour
- Client POSTs file directly to this URL

**System Table**: `_storage` table tracks all uploaded files

- Fields: `_id`, `sha256`, `size`, `contentType`, `_creationTime`
- Queryable via `ctx.db.system.get()` or `ctx.db.system.query("_storage")`

### File Size Limits

- **Upload URL method**: No size limit, but 2-minute timeout on POST request
- **HTTP Action method**: 20MB limit (not used in this spec)
- **Practical limit**: ~100MB for 2-minute timeout on fast connection

### URL Generation

```typescript
// In query or mutation
const url = await ctx.storage.getUrl(storageId);
// Returns: "https://convex-cloud.com/api/storage/..." (authenticated URL)
```

URLs are **authenticated** - require Convex to generate, not publicly guessable.

### Deletion

```typescript
await ctx.storage.delete(storageId);
// Permanently deletes file from storage
// Does NOT delete metadata from _storage table automatically
```

**Important**: Always delete both the file AND the metadata row.

---

## Conclusion

This specification provides a complete blueprint for implementing mandatory image uploads in the Urban Legends submission system. The design leverages Convex's built-in file storage, follows existing architectural patterns, and ensures tournament integrity through visual proof requirements.

**Key Takeaways**:

- Users upload 1-3 images per submission as proof of activity
- Images stored in Convex with separate `submissionImages` table for metadata
- Admin review includes full-screen image gallery with keyboard navigation
- Comprehensive validation prevents fraud and ensures quality
- Mobile-friendly with camera support
- No external dependencies required

**Next Steps**:

1. Review specification with stakeholders
2. Clarify open questions (minimum image count, legacy submissions, etc.)
3. Begin Phase 1 implementation (database schema + backend mutations)
4. Iterate based on user feedback during soft launch
