"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import type { Doc, Id } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { Button } from "@/components/ui/button";

import { CardGrid } from "../../../ui/card-grid";
import { SubmissionCard } from "./submission-card";

const PAGE_SIZE = 10;

interface SubmissionCardListProps {
  submissions: Array<
    Doc<"submissions"> & {
      team: Doc<"teams">;
      user: Doc<"users">;
      thumbnailUrl?: string | null;
      evidenceCount?: number;
    }
  >;
  currentUser: UserWithRoles;
  onApprove?: (submissionId: Id<"submissions">) => void;
  onReject?: (submissionId: Id<"submissions">) => void;
  onEdit?: (submissionId: Id<"submissions">) => void;
  onDelete?: (submissionId: Id<"submissions">) => void;
}

export function SubmissionCardList({
  submissions,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardListProps) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = useMemo(
    () =>
      submissions.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [submissions, safePage],
  );

  const hasMultiplePages = pageCount > 1;

  return (
    <div className="space-y-4">
      <CardGrid
        data={pageItems}
        empty={
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No submissions found</p>
          </div>
        }
        className="grid-cols-1!"
      >
        {(submission) => (
          <SubmissionCard
            key={submission._id}
            submission={submission}
            thumbnailUrl={submission.thumbnailUrl}
            evidenceCount={submission.evidenceCount}
            currentUser={currentUser}
            onApprove={onApprove ? () => onApprove(submission._id) : undefined}
            onReject={onReject ? () => onReject(submission._id) : undefined}
            onEdit={onEdit ? () => onEdit(submission._id) : undefined}
            onDelete={onDelete ? () => onDelete(submission._id) : undefined}
          />
        )}
      </CardGrid>

      {hasMultiplePages && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Showing {safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, submissions.length)} of{" "}
            {submissions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {safePage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
