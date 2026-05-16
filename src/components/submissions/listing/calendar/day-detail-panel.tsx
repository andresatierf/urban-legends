"use client";

import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { isToday } from "@/lib/dates";

import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

type Submission = Doc<"submissions">;

interface DayDetailPanelProps {
  date: string;
  submission?: Submission;
  isFuture?: boolean;
  onSubmit: () => void;
  onEdit: () => void;
  onDelete: (submissionId: Id<"submissions">) => void;
}

export function DayDetailPanel({
  date,
  submission,
  isFuture,
  onSubmit,
  onEdit,
  onDelete,
}: DayDetailPanelProps) {
  const dateObj = new Date(date);
  const heading = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dateIsToday = isToday(date);

  return (
    <Card className="lg:sticky lg:top-4 lg:self-start">
      <CardHeader>
        <Eyebrow as="div" color="plum">
          {dateIsToday ? "Today" : isFuture ? "Upcoming day" : "Selected day"}
        </Eyebrow>
        <h3 className="text-foreground text-lg font-bold">{heading}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {submission.state === "approved" && (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="size-3" /> Approved · +
                  {submission.pointsEarned} pts
                </Badge>
              )}
              {submission.state === "pending" && (
                <Badge variant="warning" size="sm">
                  <Clock className="size-3" /> Pending review
                </Badge>
              )}
              {submission.state === "rejected" && (
                <Badge variant="error" size="sm">
                  <XCircle className="size-3" /> Rejected
                </Badge>
              )}
              <Badge variant="neutral" size="sm">
                {submission.tier} tier
              </Badge>
            </div>

            {submission.description && (
              <p className="text-foreground/90 text-sm">
                {submission.description}
              </p>
            )}

            {submission.rejectionReason && (
              <div className="text-badge-error-text bg-badge-error-bg/40 rounded-md p-3 text-xs">
                <span className="font-semibold">Reviewer note:</span>{" "}
                {submission.rejectionReason}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {submission.state === "approved" ? (
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link
                    to="/submissions/$submissionId"
                    params={{ submissionId: submission._id }}
                  >
                    <ExternalLink className="size-3.5" /> View details
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={onEdit}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )}
              {submission.state !== "approved" && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Delete submission"
                  onClick={() => onDelete(submission._id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </>
        ) : isFuture ? (
          <p className="text-muted-foreground text-sm">
            You can't submit for future days yet.
          </p>
        ) : dateIsToday ? (
          <div className="space-y-3">
            <p className="text-foreground text-sm">
              You haven't logged anything today yet.
            </p>
            <Button className="w-full" onClick={onSubmit}>
              <Plus className="size-4" /> Submit today's activity
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              No submission was logged on this day.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onSubmit}
            >
              <Plus className="size-3.5" /> Submit for this day
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
