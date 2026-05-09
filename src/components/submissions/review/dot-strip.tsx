import { cn } from "@/lib/utils";

import type { EvidenceImage } from "./types";

interface DotStripProps {
  evidence: EvidenceImage[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  className?: string;
}

export function DotStrip({
  evidence,
  activeIdx,
  onSelect,
  className,
}: DotStripProps) {
  return (
    <div className={cn("flex justify-center gap-1", className)}>
      {evidence.length <= 1 ? (
        <span className="h-4 w-5" />
      ) : (
        evidence.map((img, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={img._id}
              type="button"
              onClick={() => onSelect(idx)}
              aria-label={`Show image ${idx + 1} of ${evidence.length}`}
              aria-pressed={isActive}
              className="focus-visible:ring-ring grid h-4 w-5 place-items-center focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "h-0.5 w-5 rounded-full transition",
                  isActive ? "bg-primary" : "bg-muted",
                )}
              />
            </button>
          );
        })
      )}
    </div>
  );
}
