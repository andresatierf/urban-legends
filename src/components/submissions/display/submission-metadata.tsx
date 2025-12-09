"use client";

import { useFormattedDate } from "@/hooks/useFormattedDate";

interface SubmissionMetadataProps {
  submitter: string;
  date: string;
  description?: string;
  managedBy?: string;
  compact?: boolean;
}

/**
 * Reusable metadata display component for submission details
 * Shows submitter, date, optional description, and management info
 */
export function SubmissionMetadata({
  submitter,
  date,
  description,
  managedBy,
  compact = false,
}: SubmissionMetadataProps) {
  const { format } = useFormattedDate();
  const displaySubmitter = submitter.trim() || "Unknown";
  const displayManagedBy = managedBy?.trim() || "Unknown";

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium">Submitted by:</span> {displaySubmitter}
      </p>
      <p className="text-muted-foreground">
        <span className="font-medium">Date:</span> {format(date, "long")}
      </p>

      {!compact && description && (
        <div className="mt-3">
          <p className="mb-1 font-medium">Description:</p>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}

      {!compact && managedBy && (
        <p className="text-muted-foreground">
          <span className="font-medium">Managed by:</span> {displayManagedBy}
        </p>
      )}
    </div>
  );
}
