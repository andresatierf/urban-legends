"use client";

import { useAction } from "convex/react";
import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { SubmissionCardImage } from "./submission-card-image";

interface SubmissionCardImageLoaderProps {
  submissionId: Id<"submissions">;
}

export function SubmissionCardImageLoader({
  submissionId,
}: SubmissionCardImageLoaderProps) {
  const [images, setImages] = useState<
    Array<{
      _id: string;
      url: string;
      filename: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrls = useAction(api.submissionImages.getImageUrls);

  // Fetch image URLs when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      try {
        setLoading(true);
        const imageUrls = await getImageUrls({ submissionId });
        if (isMounted) {
          setImages(imageUrls);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch images:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load images",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [submissionId, getImageUrls]);

  if (loading) {
    return (
      <div className="flex aspect-square w-full max-w-[400] items-center justify-center rounded-lg border-2 border-dashed bg-muted">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground text-xs">
            Loading images...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex aspect-square w-full max-w-[400] items-center justify-center rounded-lg border-2 border-dashed bg-destructive/10">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-2 text-destructive text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return <SubmissionCardImage images={images} />;
}
