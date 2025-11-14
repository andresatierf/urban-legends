import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  count?: number;
  className?: string;
};

export function CardGridSkeleton({ count = 4, className }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
        <Card key={i}>
          <CardHeader>
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
