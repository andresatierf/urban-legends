import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

import { DEMO_MY_SUBMISSIONS, type DemoMySubmission } from "./fixtures";

type Props = {
  submissions?: DemoMySubmission[];
  layout?: "grid" | "row";
  showActions?: boolean;
};

const STATE_VARIANT: Record<
  DemoMySubmission["state"],
  "success" | "warning" | "error"
> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
};

export function MockSubmissionList({
  submissions = DEMO_MY_SUBMISSIONS,
  layout = "row",
  showActions = true,
}: Props) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-3",
      )}
    >
      {submissions.map((s) => (
        <Card key={s._id} size="sm" className="md:flex-row md:items-stretch">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
            <Image
              src={s.thumbUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{s.teamName}</span>
              <Badge variant={STATE_VARIANT[s.state]} size="xs">
                {s.state}
              </Badge>
              {s.state === "approved" && (
                <Badge variant="neutral" size="xs">
                  +{s.pointsEarned} pts
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {new Date(s.date).toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              · {s.tournamentName}
            </p>
            <p className="text-foreground/90 line-clamp-2 text-xs">
              {s.description}
            </p>
            {s.rejectionReason && (
              <p className="text-badge-error-text bg-badge-error-bg/40 mt-1 rounded px-2 py-1 text-[11px]">
                Rejected: {s.rejectionReason}
              </p>
            )}
          </div>
          {showActions && s.state !== "approved" && (
            <div className="flex items-end gap-1 self-end md:self-center">
              <Button size="sm" variant="ghost" aria-label="Edit submission">
                <Pencil className="size-3.5" />
              </Button>
              <Button size="sm" variant="ghost" aria-label="Delete submission">
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
