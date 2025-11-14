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
    >
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
