import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  detailsCount?: number;
  showActions?: boolean;
  className?: string;
};

export function DetailsCardSkeleton({
  detailsCount = 4,
  showActions = true,
  className,
}: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex-1 space-y-2">
            {/* Title */}
            <Skeleton className="h-7 w-3/4" />
            {/* Description */}
            <Skeleton className="h-4 w-full" />
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {Array.from({ length: detailsCount }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
