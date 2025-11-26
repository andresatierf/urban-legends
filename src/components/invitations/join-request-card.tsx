import { capitalize } from "lodash";
import { Calendar, Check, Loader2, Mail, X } from "lucide-react";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { getStatusBadge } from "./utils";

type RequestCardProps = {
  request: Doc<"joinRequests"> & {
    user: Doc<"users"> | null;
  };
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
  className?: string;
};

export function JoinRequestCard({
  request,
  processing,
  onApprove,
  onReject,
  className,
}: RequestCardProps) {
  const { format } = useFormattedDate();
  return (
    <Card className={className}>
      <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{request.user?.name}</p>
            {getStatusBadge(request.status)}
          </div>
          <p className="flex items-center gap-1 text-muted-foreground text-sm">
            <Mail className="h-3 w-3" />
            {request.user?.email}
          </p>
          {request.message && (
            <p className="mt-1 text-muted-foreground text-sm">
              {request.message}
            </p>
          )}
          <div className="mt-1 flex flex-col items-start text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Requested {format(request.createdAt, "short")}
            </span>
            {request.respondedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {`${capitalize(request.status)} ${format(request.respondedAt, "short")}`}
              </span>
            )}
          </div>
        </div>
        {request.status === "pending" && (
          <div className="flex gap-2 self-end sm:self-auto">
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
        )}
      </CardContent>
    </Card>
  );
}
