"use client";

import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Loader2,
  Shield,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Id } from "@/../convex/_generated/dataModel";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardGrid } from "@/components/ui/card-grid";
import { tryMutate } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

export default function CaptainDashboard() {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const captainedCount = useQuery(api.captain.getCaptainedTeamsCount);

  useEffect(() => {
    if (captainedCount === 0) {
      router.replace("/teams");
    }
  }, [captainedCount, router]);

  const dashboardData = useQuery(api.captain.getDashboardData);

  const respondToJoinRequest = useMutation(
    api.joinRequests.respondToJoinRequest,
  );
  const cancelInvitation = useMutation(api.teamInvitations.cancelInvitation);

  if (!dashboardData || captainedCount === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <h1 className="font-bold text-3xl">Team Captain Dashboard</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const { teams, joinRequests, invitations } = dashboardData;

  const handleApproveRequest = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    await tryMutate({
      fn: () => respondToJoinRequest({ requestId, approve: true }),
      successToast: "Join request approved",
      defaultFailureToast: "Failed to approve request",
    });
    setProcessingId(null);
  };

  const handleRejectRequest = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    await tryMutate({
      fn: () => respondToJoinRequest({ requestId, approve: false }),
      successToast: "Join request rejected",
      defaultFailureToast: "Failed to reject request",
    });
    setProcessingId(null);
  };

  const handleCancelInvitation = async (invitationId: Id<"joinRequests">) => {
    setProcessingId(invitationId);
    await tryMutate({
      fn: () => cancelInvitation({ invitationId }),
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
        description={`Manage your ${teams.length} ${teams.length === 1 ? "team" : "teams"}`}
        Icon={Shield}
      />

      <SectionHeader title="Your Teams" />
      <CardGrid
        data={teams}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {(teamData) => (
          <Card key={teamData.team._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{teamData.team.name}</span>
                <Link href={`/teams/${teamData.team._id}`}>
                  <Button size="sm" variant="ghost">
                    Manage
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>
                {teamData.tournament?.name || "Unknown Tournament"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>{teamData.points} points</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{teamData.membersCount} members</span>
              </div>
              <div className="text-muted-foreground text-sm">
                {teamData.approvedCount}/{teamData.submissionsCount} submissions
                approved
              </div>
            </CardContent>
          </Card>
        )}
      </CardGrid>

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
                      <p className="font-medium text-sm">
                        {request.user?.name || "Unknown User"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        wants to join {request.team?.name || "Unknown Team"}
                      </p>
                      {request.message && (
                        <p className="mt-1 text-muted-foreground text-xs">
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
                        color="destructive"
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
                      <p className="font-medium text-sm">
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
          <Link href="/captain/comparison">
            <Button variant="outline">
              <Trophy className="mr-2 h-4 w-4" />
              Compare Teams
            </Button>
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
