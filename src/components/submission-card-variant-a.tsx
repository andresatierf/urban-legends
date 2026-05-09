import { capitalize } from "lodash";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";
import type {
  DemoCardItem,
  DemoSubmissionState,
} from "./submission-card-demo-fixtures";

function stateBadgeVariant(state: DemoSubmissionState): BadgeProps["variant"] {
  if (state === "approved") return "default";
  if (state === "rejected") return "destructive";
  if (state === "deleted") return "secondary";
  return "outline";
}

interface VariantAProps {
  item: DemoCardItem;
}

export function SubmissionCardVariantA({ item }: VariantAProps) {
  const { format } = useFormattedDate();
  const isPending = item.state === "pending";

  const onApprove = () => toast.success("Approved (demo)");
  const onReject = () => toast.error("Rejected (demo)");

  return (
    <Card className="flex flex-col gap-2 overflow-hidden pt-0 pb-2">
      {item.type === "individual" ? (
        <IndividualLead item={item} />
      ) : (
        <GroupMosaicLead item={item} />
      )}

      <CardContent className="flex-1 space-y-2 pt-1">
        <Chips item={item} />
        <p className="font-semibold leading-tight">{item.team.name}</p>
        <p className="text-muted-foreground text-sm">{item.tournament.name}</p>
        <div className="text-muted-foreground text-sm">
          {item.type === "individual" ? (
            <p>
              {item.submitter.name} &middot; {format(item.date, "short")}
            </p>
          ) : (
            <>
              <p>
                {item.participantCount}/{item.totalTeamMembers} participants
                &middot;{" "}
                {Math.round(
                  (item.participantCount / item.totalTeamMembers) * 100,
                )}
                %
              </p>
              <p>{format(item.date, "short")}</p>
            </>
          )}
        </div>
      </CardContent>

      {isPending && (
        <CardFooter className="gap-2 border-t px-2 pt-2!">
          <Button size="sm" onClick={onApprove} className="flex-1 gap-1.5">
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onReject}
            className="flex-1 gap-1.5"
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function Chips({ item }: { item: DemoCardItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        variant={stateBadgeVariant(item.state)}
        className="font-medium text-[10px] shadow-sm"
      >
        {capitalize(item.state)}
      </Badge>
      {item.tier === "advanced" && (
        <Badge
          variant="outline"
          className="gap-0.5 bg-background/90 font-medium text-[10px] shadow-sm backdrop-blur"
        >
          <Sparkles className="h-2.5 w-2.5" />
          Advanced
        </Badge>
      )}
      {item.type === "group" && (
        <Badge
          variant="outline"
          className="gap-0.5 bg-background/90 font-medium text-[10px] shadow-sm backdrop-blur"
        >
          <Users className="h-2.5 w-2.5" />
          Team
        </Badge>
      )}
      {item.pointsEarned > 0 && (
        <Badge
          variant="outline"
          className="bg-background/90 font-medium text-[10px] shadow-sm backdrop-blur"
        >
          +{item.pointsEarned} pts
        </Badge>
      )}
    </div>
  );
}

function IndividualLead({
  item,
}: {
  item: Extract<DemoCardItem, { type: "individual" }>;
}) {
  const all = item.evidence;
  const [activeIdx, setActiveIdx] = useState(0);
  if (all.length === 0) {
    return (
      <div className="aspect-square w-full px-3 pt-3">
        <div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
    );
  }
  const safeIdx = Math.min(activeIdx, all.length - 1);
  const active = all[safeIdx];
  const hasMultiple = all.length > 1;
  const goPrev = () => setActiveIdx((i) => (i - 1 + all.length) % all.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % all.length);
  return (
    <div className="space-y-2 px-3 pt-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <Image
          src={active.url}
          alt={active.filename}
          className="h-full w-full object-cover"
        />
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="-translate-y-1/2 absolute top-1/2 left-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="-translate-y-1/2 absolute top-1/2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {hasMultiple && (
        <div className="flex justify-center gap-1">
          {all.map((img, idx) => (
            <span
              key={img.id}
              className={cn(
                "h-0.5 w-5 rounded-full transition",
                idx === safeIdx ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupMosaicLead({
  item,
}: {
  item: Extract<DemoCardItem, { type: "group" }>;
}) {
  const withImages = item.submitterEvidence.filter(
    (se) => se.evidence.length > 0,
  );
  if (withImages.length === 0) {
    return (
      <div className="aspect-square w-full px-3 pt-3">
        <div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const cellCount = Math.min(withImages.length, 4);
  const visible = withImages.slice(0, cellCount);
  const extra = withImages.length - cellCount;

  const cellImage = (idx: number, className?: string) => {
    const img = visible[idx].evidence[0];
    return (
      <Image
        key={visible[idx].submitter.id}
        src={img.url}
        alt={img.filename}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  };

  return (
    <div className="aspect-square w-full px-3 pt-3">
      <div className="relative h-full w-full overflow-hidden rounded-md">
        {cellCount === 1 && cellImage(0)}

        {cellCount === 2 && (
          <div className="grid h-full grid-cols-2 gap-0.5">
            {cellImage(0)}
            {cellImage(1)}
          </div>
        )}

        {cellCount === 3 && (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
            {cellImage(0, "row-span-2")}
            {cellImage(1)}
            {cellImage(2)}
          </div>
        )}

        {cellCount === 4 && (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
            {cellImage(0)}
            {cellImage(1)}
            {cellImage(2)}
            {cellImage(3)}
          </div>
        )}

        {extra > 0 && (
          <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
            +{extra} more
          </div>
        )}
      </div>
    </div>
  );
}
