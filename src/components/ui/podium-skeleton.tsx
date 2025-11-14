import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  className?: string;
};

export function PodiumSkeleton({ className }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: 3 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
        <Card key={i}>
          <CardContent className="flex flex-col items-center p-6">
            <Skeleton className="mb-4 h-12 w-12 rounded-full" />
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
