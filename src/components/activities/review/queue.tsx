"use client";

import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, FileCheck, X } from "lucide-react";
import { useCallback, useState } from "react";

import { RejectReasonDialog } from "@/components/activities/reject-reason-dialog";
import { activityStateBadgeVariant } from "@/components/activities/state";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function ActivityReviewerQueue() {
  const [includeIncomplete, setIncludeIncomplete] = useState(false);
  const items = useQuery(api.activities.reviewerQueue, { includeIncomplete });
  const approve = useMutation(api.activities.approve);
  const reject = useMutation(api.activities.reject);

  const [rejectDialogFor, setRejectDialogFor] =
    useState<Id<"activities"> | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = useCallback(
    (activityId: Id<"activities">) => {
      void tryMutate({
        fn: () => approve({ activityId }),
        successToast: "Activity approved successfully",
        defaultFailureToast: "Failed to approve activity",
      });
    },
    [approve],
  );

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectDialogFor) return;
      setIsRejecting(true);
      try {
        await tryMutate({
          fn: () => reject({ activityId: rejectDialogFor, reason }),
          successToast: "Activity rejected successfully",
          defaultFailureToast: "Failed to reject activity",
        });
      } finally {
        setIsRejecting(false);
        setRejectDialogFor(null);
      }
    },
    [reject, rejectDialogFor],
  );

  const header = (
    <div className="flex items-center justify-between gap-2">
      <SectionHeader title="Review Queue" Icon={FileCheck} />
      <div className="flex items-center gap-2">
        <Switch
          id="include-incomplete"
          checked={includeIncomplete}
          onCheckedChange={setIncludeIncomplete}
        />
        <Label htmlFor="include-incomplete" className="text-sm font-normal">
          Show incomplete
        </Label>
      </div>
    </div>
  );

  if (items === undefined) {
    return (
      <section className="space-y-4">
        {header}
        <Skeleton className="h-96 w-full rounded-lg" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {header}

      <RejectReasonDialog
        open={rejectDialogFor !== null}
        onOpenChange={(open) => {
          if (!open) setRejectDialogFor(null);
        }}
        onConfirm={handleRejectConfirm}
        isSubmitting={isRejecting}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            {includeIncomplete
              ? "No pending or incomplete activities to review."
              : "No pending activities to review."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              {item.thumbnailUrl && (
                <Image
                  src={item.thumbnailUrl}
                  alt="Evidence thumbnail"
                  width={400}
                  height={200}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              )}
              <CardContent className="space-y-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={activityStateBadgeVariant(item.state)}>
                    {item.state}
                  </Badge>
                  <Badge variant={item.tier === "advanced" ? "social" : "info"}>
                    {item.tier}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.teamName}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.creatorName} · {item.date}
                  </p>
                  {item.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {item.state === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(item._id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectDialogFor(item._id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      to="/activities/$activityId"
                      params={{ activityId: item._id }}
                      search={{ from: "review" }}
                    >
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
