"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = useCallback(() => {
    onConfirm(reason.trim());
    setReason("");
  }, [reason, onConfirm]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setReason("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject submission</DialogTitle>
          <DialogDescription>
            Provide a reason so the submitter knows what to fix.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- focusing the first field on dialog open is the expected pattern
          autoFocus
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting || reason.trim().length === 0}
          >
            {isSubmitting ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
