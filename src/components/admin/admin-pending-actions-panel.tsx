"use client";

import { Link } from "@tanstack/react-router";
import { FileCheck, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminPendingActionsPanelProps {
  pendingActions: {
    pendingSubmissions: number;
    joinRequests: number;
  };
}

export function AdminPendingActionsPanel({
  pendingActions,
}: AdminPendingActionsPanelProps) {
  const totalPending =
    pendingActions.pendingSubmissions + pendingActions.joinRequests;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
        <CardDescription>
          {totalPending === 0
            ? "All caught up! No pending actions."
            : `${totalPending} action${totalPending === 1 ? "" : "s"} requiring attention`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <FileCheck className="text-muted-foreground h-5 w-5" />
            <div>
              <div className="text-sm font-medium">Pending Submissions</div>
              <div className="text-muted-foreground text-xs">
                Awaiting approval
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                pendingActions.pendingSubmissions > 0 ? "secondary" : "outline"
              }
            >
              {pendingActions.pendingSubmissions}
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/manage/submissions">View</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <UserPlus className="text-muted-foreground h-5 w-5" />
            <div>
              <div className="text-sm font-medium">Join Requests</div>
              <div className="text-muted-foreground text-xs">
                System-wide pending requests
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                pendingActions.joinRequests > 0 ? "secondary" : "outline"
              }
            >
              {pendingActions.joinRequests}
            </Badge>
            <Button variant="ghost" size="sm" disabled>
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
