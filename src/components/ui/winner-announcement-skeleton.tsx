import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  className?: string;
};

export function WinnerAnnouncementSkeleton({ className }: Props) {
  return (
    <Card
      className={cn(
        "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading winner announcement"
    >
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
