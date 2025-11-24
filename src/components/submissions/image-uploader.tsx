"use client";

import { useAction, useMutation } from "convex/react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
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
  const inputId = useId();
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
            throw new Error(
              `Upload failed for ${file.name}: ${response.statusText}`,
            );
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
          onClick={() => document.getElementById(inputId)?.click()}
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
          id={inputId}
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
