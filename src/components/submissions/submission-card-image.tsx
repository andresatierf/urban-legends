"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SubmissionCardImageProps {
  images: Array<{
    _id: string;
    url: string;
    filename: string;
  }>;
}

export function SubmissionCardImage({ images }: SubmissionCardImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground text-xs">No images</p>
        </div>
      </div>
    );
  }

  const primaryImage = images[0];
  const hasMultiple = images.length > 1;

  return (
    <>
      {/* Primary Image Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setLightboxOpen(true);
          }}
          className="group relative block w-full overflow-hidden rounded-lg"
        >
          <img
            src={primaryImage.url}
            alt={primaryImage.filename}
            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {hasMultiple && (
            <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
              +{images.length - 1} more
            </div>
          )}
        </button>

        {/* Thumbnail Strip (if multiple images) */}
        {hasMultiple && (
          <div className="mt-2 flex gap-2">
            {images.slice(1, 3).map((img, idx) => (
              <button
                key={img._id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx + 1);
                  setLightboxOpen(true);
                }}
                className="relative h-16 w-16 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {images.length > 3 && (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted font-medium text-xs">
                +{images.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <div className="relative">
            <img
              src={images[currentIndex]?.url}
              alt={images[currentIndex]?.filename}
              className="h-auto max-h-[70vh] w-full object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="-translate-y-1/2 absolute top-1/2 left-2"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1,
                    )
                  }
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="-translate-y-1/2 absolute top-1/2 right-2"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1,
                    )
                  }
                >
                  <ChevronRight />
                </Button>
              </>
            )}

            <div className="mt-4 text-center">
              <p className="font-medium text-sm">
                {images[currentIndex]?.filename}
              </p>
              {images.length > 1 && (
                <p className="text-muted-foreground text-xs">
                  {currentIndex + 1} / {images.length}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
