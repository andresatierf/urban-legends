"use client";

import { ImageIcon } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import type { SubmitterEvidence } from "./types";

interface EvidenceMosaicProps {
  submitterEvidence: SubmitterEvidence[];
  className?: string;
  onImageClick?: (submitterIndex: number) => void;
}

export function EvidenceMosaic({
  submitterEvidence,
  className,
  onImageClick,
}: EvidenceMosaicProps) {
  const withImages = submitterEvidence.filter((se) => se.evidence.length > 0);

  if (withImages.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-t-lg bg-muted",
          className,
        )}
      >
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground text-xs">No evidence</p>
        </div>
      </div>
    );
  }

  const cellCount =
    withImages.length === 1 ? 1 : withImages.length === 2 ? 2 : 4;
  const visibleSubmitters = withImages.slice(0, cellCount);
  const extraCount = withImages.length - cellCount;

  if (cellCount === 1) {
    const img = visibleSubmitters[0].evidence[0];
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => onImageClick?.(0)}
          className="group relative block w-full overflow-hidden rounded-t-lg"
          aria-label={`View evidence from ${visibleSubmitters[0].submitterName}`}
        >
          <Image
            src={img.url}
            alt={
              img.filename ??
              `Evidence from ${visibleSubmitters[0].submitterName}`
            }
            width={800}
            height={450}
            className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </button>
      </div>
    );
  }

  if (cellCount === 2) {
    return (
      <div
        className={cn(
          "relative grid grid-cols-2 gap-0.5 overflow-hidden rounded-t-lg",
          className,
        )}
      >
        {visibleSubmitters.map((se, idx) => {
          const img = se.evidence[0];
          return (
            <button
              key={se.userId}
              type="button"
              onClick={() => onImageClick?.(idx)}
              className="group relative block overflow-hidden"
              aria-label={`View evidence from ${se.submitterName}`}
            >
              <Image
                src={img.url}
                alt={img.filename ?? `Evidence from ${se.submitterName}`}
                width={400}
                height={225}
                className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </button>
          );
        })}
        {extraCount > 0 && (
          <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
            +{extraCount} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-t-lg",
        className,
      )}
    >
      {visibleSubmitters.map((se, idx) => {
        const img = se.evidence[0];
        return (
          <button
            key={se.userId}
            type="button"
            onClick={() => onImageClick?.(idx)}
            className="group relative block overflow-hidden"
            aria-label={`View evidence from ${se.submitterName}`}
          >
            <Image
              src={img.url}
              alt={img.filename ?? `Evidence from ${se.submitterName}`}
              width={400}
              height={225}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </button>
        );
      })}
      {extraCount > 0 && (
        <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
          +{extraCount} more
        </div>
      )}
    </div>
  );
}
