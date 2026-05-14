import { cn } from "@/lib/utils";

import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  className?: string;
};

export function WinnerAnnouncementSkeleton({ className }: Props) {
  return (
    <Card
      className={cn(
        "border-podium-gold bg-podium-gold-bg shadow-fd-md",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading winner announcement"
    >
      <CardContent className="pt-5">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-9 w-56" />
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-6 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="mx-auto h-5 w-32" />
            <div className="flex flex-wrap justify-center gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
