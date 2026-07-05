"use client";

import { useAction, useMutation } from "convex/react";
import { ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { processForUpload } from "@/lib/clientImage";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_EVIDENCE = 5;

type PreviewItem = {
  storageId: Id<"_storage">;
  previewUrl: string;
};

interface EvidenceUploaderProps {
  onStorageIdsChange: (storageIds: Id<"_storage">[]) => void;
  storageIds?: Id<"_storage">[];
  initialItems?: PreviewItem[];
}

export function EvidenceUploader({
  onStorageIdsChange,
  storageIds: _storageIds,
  initialItems,
}: EvidenceUploaderProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>(
    () => initialItems ?? [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issueUploadUrl = useAction(api.evidenceStorage.issueUploadUrl);
  const registerUpload = useMutation(api.evidenceStorage.registerUpload);

  useEffect(() => {
    return () => {
      for (const p of previews) URL.revokeObjectURL(p.previewUrl);
    };
  }, [previews]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (previews.length + files.length > MAX_EVIDENCE) {
      toast.error(`Maximum ${MAX_EVIDENCE} Evidence images allowed`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const newPreviews: PreviewItem[] = [];

    try {
      for (const file of files) {
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

          newPreviews.push({
            storageId,
            previewUrl: URL.createObjectURL(blob),
          });
        } catch (err) {
          toast.error(
            `Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`,
          );
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    if (newPreviews.length > 0) {
      setPreviews((prev) => {
        const next = [...prev, ...newPreviews];
        onStorageIdsChange(next.map((p) => p.storageId));
        return next;
      });
    }
  };

  const handleRemove = (storageId: Id<"_storage">) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.storageId === storageId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const next = prev.filter((p) => p.storageId !== storageId);
      onStorageIdsChange(next.map((p) => p.storageId));
      return next;
    });
  };

  const canAddMore = previews.length < MAX_EVIDENCE;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Evidence{" "}
        <span className="text-muted-foreground font-normal">
          (1–5 photos required)
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {previews.map((item) => (
          <div key={item.storageId} className="relative">
            <Image
              src={item.previewUrl}
              alt="Evidence preview"
              width={96}
              height={96}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => handleRemove(item.storageId)}
              aria-label="Remove evidence"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-muted text-muted-foreground hover:bg-muted/80 flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed disabled:opacity-50"
            aria-label="Add evidence photo"
          >
            <ImageIcon className="h-6 w-6" />
            <span className="mt-1 text-xs">
              {isUploading ? "Uploading…" : "Add photo"}
            </span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Select evidence images"
      />
    </div>
  );
}
