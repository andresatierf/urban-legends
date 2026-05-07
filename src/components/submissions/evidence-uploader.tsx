"use client";

import { useAction, useMutation } from "convex/react";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { processForUpload } from "@/lib/clientImage";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface EvidenceUploaderProps {
  onStorageIdChange: (storageId: Id<"_storage"> | null) => void;
  currentStorageId?: Id<"_storage"> | null;
}

export function EvidenceUploader({
  onStorageIdChange,
  currentStorageId,
}: EvidenceUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issueUploadUrl = useAction(api.evidenceStorage.issueUploadUrl);
  const registerUpload = useMutation(api.evidenceStorage.registerUpload);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const blob = await processForUpload(file);
      const uploadUrl = await issueUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };

      await registerUpload({ storageId });

      const preview = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return preview;
      });
      onStorageIdChange(storageId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onStorageIdChange(null);
  };

  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">Evidence (optional)</p>
      {currentStorageId && previewUrl ? (
        <div className="relative inline-block">
          <Image
            src={previewUrl}
            alt="Evidence preview"
            width={128}
            height={128}
            className="h-32 w-32 rounded-lg object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="-right-2 -top-2 absolute h-6 w-6"
            onClick={handleRemove}
            aria-label="Remove evidence"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          aria-label="Add evidence photo"
        >
          <ImageIcon className="h-8 w-8" />
          <span className="mt-1 text-xs">
            {isUploading ? "Uploading…" : "Add photo"}
          </span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Select evidence image"
      />
    </div>
  );
}
