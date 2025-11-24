"use client";

import { useAction, useQuery } from "convex/react";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ImageManagerProps {
  submissionId: Id<"submissions">;
  canDelete: boolean;
}

export function ImageManager({ submissionId, canDelete }: ImageManagerProps) {
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [confirmDeleteImageId, setConfirmDeleteImageId] = useState<
    string | null
  >(null);

  const images = useQuery(api.submissionImages.list, { submissionId });
  const getImageUrls = useAction(api.submissionImages.getImageUrls);
  const deleteImage = useAction(api.submissionImages.deleteImage);

  const [imageUrls, setImageUrls] = useState<
    Array<{ _id: string; url: string; filename: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch image URLs
  useState(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const urls = await getImageUrls({ submissionId });
        setImageUrls(urls);
      } catch (err) {
        console.error("Failed to fetch images:", err);
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchImages();
    }
  });

  const handleDelete = async (imageId: Id<"submissionImages">) => {
    setDeletingImageId(imageId);
    try {
      await deleteImage({ imageId });
      toast.success("Image deleted successfully");
      setImageUrls((prev) => prev.filter((img) => img._id !== imageId));
      setConfirmDeleteImageId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete image",
      );
    } finally {
      setDeletingImageId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground text-sm">
        Loading images...
      </div>
    );
  }

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {imageUrls.map((img) => (
          <div key={img._id} className="group relative">
            {/* biome-ignore lint/performance/noImgElement: using native img for action-based URLs */}
            <img
              src={img.url}
              alt={img.filename}
              className="aspect-square w-full rounded-lg border object-cover"
            />
            {canDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() =>
                  setConfirmDeleteImageId(img._id as Id<"submissionImages">)
                }
                disabled={deletingImageId === img._id}
              >
                {deletingImageId === img._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <p className="mt-1 truncate text-muted-foreground text-xs">
              {img.filename}
            </p>
          </div>
        ))}
      </div>

      <AlertDialog
        open={confirmDeleteImageId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteImageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteImageId) {
                  handleDelete(confirmDeleteImageId as Id<"submissionImages">);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
