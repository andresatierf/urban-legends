"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";

interface EvidenceLightboxProps {
  images: Array<{
    _id: string;
    url: string;
    filename?: string;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export function EvidenceLightbox({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
}: EvidenceLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  if (images.length === 0) return null;

  const altFor = (img: { filename?: string }, idx: number) =>
    img.filename ?? `Evidence ${idx + 1}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}
