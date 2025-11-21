"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
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
      <div className="flex aspect-square w-full max-w-[400] items-center justify-center rounded-lg border-2 border-dashed bg-muted">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground text-xs">No images</p>
        </div>
      </div>
    );
  }

  const _hasMultiple = images.length > 1;
  const showTwoLarge = images.length >= 2;

  return (
    <>
      {/* Image Display */}
      <div className="relative max-w-[400]">
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
              >
                <Image
                  src={img.url}
                  alt={img.filename}
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
          >
            <Image
              src={images[0].url}
              alt={images[0].filename}
              width={800}
              height={800}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </button>
        )}

        {/* Thumbnail Strip (if more than 2 images) */}
        {images.length > 2 && (
          <div className="mt-2 flex gap-2">
            {images.slice(2, 4).map((img, idx) => (
              <button
                key={img._id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx + 2);
                  setLightboxOpen(true);
                }}
                className="relative h-16 w-16 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
              >
                <Image
                  src={img.url}
                  alt={img.filename}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {images.length > 4 && (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted font-medium text-xs">
                +{images.length - 4}
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
              alt={images[currentIndex]?.filename}
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
