import { Check, Loader2, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type RequestCardProps = {
  request: {
    user: {
      name: string;
      email: string;
    };
    message: string;
    createdAt: string;
    _id: Id<"joinRequests">;
  };
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function RequestCard({
  request,
  processing,
  onApprove,
  onReject,
}: RequestCardProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-8 rounded-lg border p-4 sm:flex-row">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{request.user?.name}</p>
          <Badge variant="secondary">{request.user?.email}</Badge>
        </div>
        {request.message && (
          <p className="text-muted-foreground text-sm">{request.message}</p>
        )}
        <p className="mt-1 text-muted-foreground text-xs">
          Requested {new Date(request.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={processing}
        >
          {processing ? <Loader2 className="animate-spin" /> : <X />}
          Reject
        </Button>
        <Button size="sm" onClick={onApprove} disabled={processing}>
          {processing ? <Loader2 className="animate-spin" /> : <Check />}
          Approve
        </Button>
      </div>
    </div>
  );
}
