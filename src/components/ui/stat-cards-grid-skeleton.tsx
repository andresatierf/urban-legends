import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  count?: number;
  className?: string;
};

export function StatCardsGridSkeleton({ count = 6, className }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="pt-2">
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
