import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Loader2, Shield, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/captain/")({
  component: CaptainDashboard,
});

function CaptainDashboard() {
  const navigate = useNavigate();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const captainedCount = useQuery(
    api.views.captainDashboard.getCaptainedTeamsCount,
  );

  useEffect(() => {
    if (captainedCount === 0) {
      navigate({ to: "/teams", replace: true });
    }
  }, [captainedCount, navigate]);

  const dashboardData = useQuery(api.views.captainDashboard.get);

  const acceptJoinRequest = useMutation(api.joinRequests.accept);
  const rejectJoinRequest = useMutation(api.joinRequests.reject);
  const cancelInvitation = useMutation(api.joinRequests.cancel);

  if (!dashboardData || captainedCount === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Team Captain Dashboard</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const { joinRequests, invitations } = dashboardData;

  const handleApproveRequest = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    await tryMutate({
      fn: () => acceptJoinRequest({ requestId }),
      successToast: "Join request approved",
      defaultFailureToast: "Failed to approve request",
    });
    setProcessingId(null);
  };

  const handleRejectRequest = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    await tryMutate({
      fn: () => rejectJoinRequest({ requestId }),
      successToast: "Join request rejected",
      defaultFailureToast: "Failed to reject request",
    });
    setProcessingId(null);
  };

  const handleCancelInvitation = async (invitationId: Id<"joinRequests">) => {
    setProcessingId(invitationId);
    await tryMutate({
      fn: () => cancelInvitation({ requestId: invitationId }),
      successToast: "Invitation cancelled",
      defaultFailureToast: "Failed to cancel invitation",
    });
    setProcessingId(null);
  };

  return (
    <>
      <SectionHeader
        as="h1"
        title="Team Captain Dashboard"
        description="Manage your team roster and pending requests"
        Icon={Shield}
      />

      {(joinRequests.length > 0 || invitations.length > 0) && (
        <>
          <SectionHeader
            title="Pending Actions"
            description={`${joinRequests.length + invitations.length} actions`}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {joinRequests.length > 0 && (
              <ListCard
                title={`Join Requests (${joinRequests.length})`}
                description={"Players requesting to join your teams"}
                data={joinRequests}
              >
                {(request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {request.user?.name || "Unknown User"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        wants to join {request.team?.name || "Unknown Team"}
                      </p>
                      {request.message && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request._id)}
                        disabled={processingId === request._id}
                      >
                        {processingId === request._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request._id)}
                        disabled={processingId === request._id}
                      >
                        {processingId === request._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </ListCard>
            )}

            {invitations.length > 0 && (
              <ListCard
                title={`Sent Invitations (${invitations.length})`}
                description={"Invitations you've sent to players"}
                data={invitations}
              >
                {(invitation) => (
                  <div
                    key={invitation._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {invitation.invitedUser?.name ||
                          invitation.invitedUser?.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Invited to {invitation.team?.name || "Unknown Team"} •
                        Pending
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelInvitation(invitation._id)}
                      disabled={processingId === invitation._id}
                    >
                      {processingId === invitation._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                  </div>
                )}
              </ListCard>
            )}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common captain tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link to="/captain/comparison">
            <Button variant="outline">Compare Teams</Button>
          </Link>
        </CardContent>
      </Card>
    </>
  );
}

function ListCard<T>({
  title,
  description,
  data,
  children,
}: {
  title: string;
  description: string;
  data: T[];
  children: (item: T) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="m-4 max-h-72 space-y-2 overflow-scroll p-0">
        {data.map((item) => children(item))}
      </CardContent>
    </Card>
  );
}
