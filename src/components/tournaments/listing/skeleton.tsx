import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <Skeleton className="h-9 w-full rounded-t-lg rounded-b-none" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </Card>
  );
}

export function TournamentListingSkeleton() {
  return (
    <div className="space-y-8">
      <section className="border-ink bg-paper-deep rounded-2xl border-2 p-5 shadow sm:p-6">
        <Skeleton className="mb-4 h-7 w-48" />
        <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
