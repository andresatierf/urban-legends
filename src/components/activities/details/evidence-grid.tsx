import { ImageIcon } from "lucide-react";

import { SectionHeader } from "@/components/section-header";

import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import { Image } from "../../ui/image";
import type { ActivityDetailsData } from "./types";

type Props = {
  evidence: ActivityDetailsData["evidence"];
};

export function EvidenceGrid({ evidence }: Props) {
  return (
    <>
      <SectionHeader as="h2" title="Evidence" Icon={ImageIcon} />
      {evidence.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {evidence.map((img, idx) => (
            <Card
              key={img._id}
              size="sm"
              className="overflow-hidden p-0 data-[size=sm]:p-0"
            >
              <Image
                src={img.url}
                alt={img.filename ?? `Evidence ${idx + 1}`}
                width={400}
                height={300}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
              <CardContent className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-xs font-medium">
                  {img.filename ?? `Evidence ${idx + 1}`}
                </span>
                <Badge variant="neutral" className="shrink-0 text-xs">
                  #{idx + 1}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 py-6 text-sm">
            <ImageIcon className="h-4 w-4" />
            No evidence attached.
          </CardContent>
        </Card>
      )}
    </>
  );
}
