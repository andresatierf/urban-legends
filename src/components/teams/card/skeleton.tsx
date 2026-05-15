import { Skeleton } from "@/components/ui/skeleton";

export function TeamCardSkeleton() {
  return (
    <div className="border-ink shadow-fd-lg bg-card flex flex-col gap-0 overflow-visible rounded-2xl border-2">
      <header className="border-ink bg-paper-deep flex items-center justify-between gap-3 rounded-t-[18px] border-b-2 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-5 w-12" />
      </header>
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <Skeleton className="h-12 rounded-md" />
      </div>
      <div className="-mb-3.5 flex items-center gap-2 px-4">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="ml-auto h-7 w-24" />
      </div>
    </div>
  );
}
