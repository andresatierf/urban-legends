"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

interface EvidenceGalleryProps {
  images: Array<{
    _id: string;
    url: string;
    filename?: string;
  }>;
  layout?: "grid" | "single";
  maxDisplay?: number;
  className?: string;
}

export function EvidenceGallery({
  images,
  layout = "grid",
  maxDisplay = 4,
  className,
}: EvidenceGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full max-w-[128px] items-center justify-center rounded-lg border-2 border-dashed bg-muted",
          className,
        )}
      >
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground text-xs">No images</p>
        </div>
      </div>
    );
  }

  const showTwoLarge = images.length >= 2 && layout === "grid";
  const altFor = (img: { filename?: string }, idx: number) =>
    img.filename ?? `Evidence ${idx + 1}`;

  return (
    <>
      {/* Image Display */}
      <div className={cn("relative max-w-[128px]", className)}>
        {showTwoLarge ? (
          /* Two Large Images Side-by-Side */
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 2).map((img, idx) => (
              <button
                key={img._id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setLightboxOpen(true);
                }}
                className="group relative block overflow-hidden rounded-lg"
                aria-label={`View image ${idx + 1}: ${altFor(img, idx)}`}
              >
                <Image
                  src={img.url}
                  alt={altFor(img, idx)}
                  width={400}
                  height={400}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
            {images.length > 2 && (
              <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
                +{images.length - 2} more
              </div>
            )}
          </div>
        ) : (
          /* Single Large Image */
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              setLightboxOpen(true);
            }}
            className="group relative block w-full overflow-hidden rounded-lg"
            aria-label={`View image: ${altFor(images[0], 0)}`}
          >
            <Image
              src={images[0].url}
              alt={altFor(images[0], 0)}
              width={800}
              height={800}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </button>
        )}

        {/* Thumbnail Strip (if more than 2 images) */}
        {images.length > 2 && layout === "grid" && (
          <div className="mt-2 flex gap-2">
            {images.slice(2, maxDisplay).map((img, idx) => (
              <button
                key={img._id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx + 2);
                  setLightboxOpen(true);
                }}
                className="relative h-16 w-16 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
                aria-label={`View image ${idx + 3}: ${altFor(img, idx + 2)}`}
              >
                <Image
                  src={img.url}
                  alt={altFor(img, idx + 2)}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {images.length > maxDisplay && (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted font-medium text-xs">
                +{images.length - maxDisplay}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <div className="relative">
            <Image
              src={images[currentIndex]?.url}
              alt={altFor(images[currentIndex] ?? images[0], currentIndex)}
              width={1200}
              height={1200}
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
                  aria-label="Previous image"
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
                  aria-label="Next image"
                >
                  <ChevronRight />
                </Button>
              </>
            )}

            <div className="mt-4 text-center">
              {images[currentIndex]?.filename && (
                <p className="font-medium text-sm">
                  {images[currentIndex].filename}
                </p>
              )}
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
