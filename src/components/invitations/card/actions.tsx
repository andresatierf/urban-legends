import { Check, Loader2, X } from "lucide-react";

import { Button } from "../../ui/button";
import type { Viewer } from "./types";

type ActionLabels = { primary: string | null; secondary: string | null };

export function resolveActionLabels({
  viewer,
  initiator,
}: {
  viewer: Viewer;
  initiator: "team" | "user";
}): ActionLabels {
  if (viewer === initiator) {
    return { primary: null, secondary: "Cancel" };
  }
  if (initiator === "team") {
    return { primary: "Accept", secondary: "Decline" };
  }
  return { primary: "Approve", secondary: "Reject" };
}

type ButtonProps = {
  label: string;
  processing: boolean;
  onClick?: () => void;
};

export function PrimaryActionButton({
  label,
  processing,
  onClick,
}: ButtonProps) {
  return (
    <Button size="sm" variant="grass" onClick={onClick} disabled={processing}>
      {processing ? <Loader2 className="animate-spin" /> : <Check />}
      {label}
    </Button>
  );
}

export function SecondaryActionButton({
  label,
  processing,
  onClick,
}: ButtonProps) {
  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={onClick}
      disabled={processing}
    >
      {processing ? <Loader2 className="animate-spin" /> : <X />}
      {label}
    </Button>
  );
}
