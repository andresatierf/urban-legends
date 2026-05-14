import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock, FileCheck, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { UpsertSubmissionFormDialog } from "@/components/form/upsert-submission-form";
import { SectionHeader } from "@/components/section-header";
import { CalendarStatistics } from "@/components/submissions/listing/calendar/calendar-statistics";
import { SubmissionCalendar } from "@/components/submissions/listing/calendar/submission-calendar";
import { SubmissionCardList } from "@/components/submissions/listing/card/submission-card-list";
import { TeamSelector } from "@/components/submissions/listing/team-selector";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToReviewItems } from "@/dto/reviewer";
import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/submissions/")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const authority = useQuery(api.submissions.getAuthority, {});

  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);
  const remove = useMutation(api.submissions.remove);
  const approveGroup = useMutation(api.submissionGroups.approve);
  const rejectGroup = useMutation(api.submissionGroups.reject);

  // ── Player state ──────────────────────────────────────────────────────────
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams">>();
  const [selectedSubmission, setSelectedSubmission] =
    useState<Doc<"submissions">>();
  const [selectedDate, setSelectedDate] = useState<string>();
  const [upsertSubmissionOpen, setUpsertSubmissionOpen] = useState(false);

  const submissions =
    useQuery(
      api.submissions.list,
      user
        ? { userId: user._id, state: ["approved", "pending", "rejected"] }
        : "skip",
    ) || [];

  const userTeams = useQuery(
    api.teams.list,
    user ? { userId: user._id } : "skip",
  );

  const tournaments = useQuery(api.tournaments.list, {}) || [];
  const tournamentIdMap = useMemo(() => {
    return tournaments.reduce<Map<Id<"tournaments">, Doc<"tournaments">>>(
      (acc, tournament) => acc.set(tournament._id, tournament),
      new Map(),
    );
  }, [tournaments]);

  const teamsWithTournaments = useMemo(() => {
    if (!userTeams) return [];
    return userTeams
      .map((team) => ({
        ...team,
        tournament: tournamentIdMap.get(team.tournamentId),
      }))
      .filter((team) => team.tournament);
  }, [userTeams, tournamentIdMap]);

  useEffect(() => {
    if (teamsWithTournaments.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teamsWithTournaments[0]._id);
    }
  }, [teamsWithTournaments, selectedTeamId]);

  const selectedTeam = teamsWithTournaments.find(
    (t) => t._id === selectedTeamId,
  );

  const teams = useQuery(api.teams.list, {}) || [];
  const teamIdMap = useMemo(() => {
    return teams.reduce<Map<Id<"teams">, Doc<"teams">>>(
      (acc, team) => acc.set(team._id, team),
      new Map(),
    );
  }, [teams]);

  const users = useQuery(api.users.list, {}) || [];
  const userIdMap = useMemo(() => {
    return users.reduce<Map<Id<"users">, Doc<"users">>>(
      (acc, u) => acc.set(u._id, u),
      new Map(),
    );
  }, [users]);

  const augmentSubmissions = useCallback(
    (subs: Doc<"submissions">[]) =>
      subs
        .map((submission) => {
          const team = teamIdMap.get(submission.teamId);
          const submissionUser = userIdMap.get(submission.userId);
          if (!team || !submissionUser) return null;
          return { ...submission, team, user: submissionUser };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    [teamIdMap, userIdMap],
  );

  // ── Review / Management state ─────────────────────────────────────────────
  const reviewData = useQuery(
    api.role.reviewer.getPendingSubmissions,
    authority?.canReview ? { limit: 500 } : "skip",
  );

  const reviewItems: ReviewItem[] = useMemo(
    () => convertToReviewItems(reviewData),
    [reviewData],
  );

  const { allItems, pendingItems, resolvedItems } = useMemo(() => {
    const pending = reviewItems.filter((item) => item.data.state === "pending");
    const resolved = reviewItems.filter(
      (item) => item.data.state !== "pending",
    );
    return {
      allItems: reviewItems,
      pendingItems: pending,
      resolvedItems: resolved,
    };
  }, [reviewItems]);

  const handleApprove = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => approve({ submissionId: item.data.submission._id }),
        successToast: "Submission approved successfully",
        defaultFailureToast: "Failed to approve submission",
      });
    } else {
      await tryMutate({
        fn: () => approveGroup({ groupId: item.data.group._id }),
        successToast: "Team activity approved successfully",
        defaultFailureToast: "Failed to approve team activity",
      });
    }
  };

  const handleReject = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => reject({ submissionId: item.data.submission._id }),
        successToast: "Submission rejected successfully",
        defaultFailureToast: "Failed to reject submission",
      });
    } else {
      await tryMutate({
        fn: () => rejectGroup({ groupId: item.data.group._id }),
        successToast: "Team activity rejected successfully",
        defaultFailureToast: "Failed to reject team activity",
      });
    }
  };

  // ── Calendar handlers ─────────────────────────────────────────────────────
  const allSubmissions = useQuery(api.submissions.list, {}) || [];

  const handleDateClick = (date: string, submissionId?: Id<"submissions">) => {
    if (!submissionId) {
      setSelectedSubmission(undefined);
      setSelectedDate(date);
      setUpsertSubmissionOpen(true);
      return;
    }

    const submission = allSubmissions.find((s) => s._id === submissionId);

    if (submission?.state === "approved") {
      navigate({
        to: "/submissions/$submissionId",
        params: { submissionId: submission._id },
      });
      return;
    }

    if (submission?.state === "rejected" || submission?.state === "deleted") {
      setSelectedSubmission(undefined);
      setSelectedDate(date);
      setUpsertSubmissionOpen(true);
      return;
    }

    setSelectedSubmission(submission);
    setSelectedDate(date);
    setUpsertSubmissionOpen(true);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedSubmission(undefined);
      setSelectedDate(undefined);
    }
    setUpsertSubmissionOpen(newOpen);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authority === undefined) {
    return <SectionHeader as="h1" title="Submissions" />;
  }

  const { canReview, canManage, isPlayer } = authority;

  return (
    <>
      <SectionHeader as="h1" title="Submissions">
        {isPlayer && (
          <UpsertSubmissionFormDialog
            open={upsertSubmissionOpen}
            onOpenChange={handleClose}
            teamId={selectedTeamId}
            submission={selectedSubmission}
            date={selectedDate}
          />
        )}
      </SectionHeader>

      {/* Management section — admins and tournament managers */}
      {canManage && (
        <section className="space-y-4">
          <SectionHeader title="Submission Management" />
          <Tabs defaultValue="pending" className="flex flex-col gap-4">
            <TabsList className="self-end">
              <TabsTrigger value="all">
                <Calendar className="mr-2 h-4 w-4" />
                All ({allItems.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="mr-2 h-4 w-4" />
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="done">
                <CheckCircle className="mr-2 h-4 w-4" />
                Done ({resolvedItems.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <SubmissionReviewList
                items={allItems}
                onApprove={handleApprove}
                onReject={handleReject}
                showFilters={true}
                emptyMessage="No submissions to display"
              />
            </TabsContent>
            <TabsContent value="pending">
              <SubmissionReviewList
                items={pendingItems}
                onApprove={handleApprove}
                onReject={handleReject}
                showFilters={true}
                emptyMessage="No pending submissions"
              />
            </TabsContent>
            <TabsContent value="done">
              <SubmissionReviewList
                items={resolvedItems}
                onApprove={handleApprove}
                onReject={handleReject}
                showFilters={true}
                emptyMessage="No resolved submissions"
              />
            </TabsContent>
          </Tabs>
        </section>
      )}

      {/* Review queue — reviewers (who are not also managers) */}
      {canReview && !canManage && (
        <section className="space-y-4">
          <SectionHeader
            title="Review Queue"
            description={`${reviewData?.total ?? 0} pending ${(reviewData?.total ?? 0) === 1 ? "item" : "items"}`}
            Icon={FileCheck}
          />
          <SubmissionReviewList
            items={reviewItems}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </section>
      )}

      {/* Player section — anyone with a team membership */}
      {isPlayer && (
        <section className="space-y-4">
          {(canManage || canReview) && (
            <SectionHeader title="Your Submissions" />
          )}
          <Tabs defaultValue="calendar">
            <TabsList className="ml-auto">
              <TabsTrigger value="calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              {teamsWithTournaments.length === 0 ? (
                <div className="rounded-lg border border-dashed">
                  <CardContent>
                    <Empty className="gap-3 py-4!">
                      <EmptyMedia>
                        <Calendar className="text-muted-foreground size-12" />
                      </EmptyMedia>
                      <EmptyHeader>No Teams Yet</EmptyHeader>
                      <EmptyDescription>
                        You're not part of any teams. Join or create a team to
                        start tracking your submissions.
                      </EmptyDescription>
                    </Empty>
                  </CardContent>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedTeam?.tournament && selectedTeamId && (
                    <>
                      <div className="relative">
                        {teamsWithTournaments.length > 1 && (
                          <div className="mb-3 flex justify-center sm:mb-0">
                            <TeamSelector
                              teams={teamsWithTournaments}
                              selectedTeamId={selectedTeamId}
                              onTeamChange={setSelectedTeamId}
                              className="sm:absolute sm:-top-4 sm:left-4 sm:z-3"
                            />
                          </div>
                        )}
                        <SubmissionCalendar
                          teamId={selectedTeamId}
                          tournamentId={selectedTeam.tournamentId}
                          onDateClick={handleDateClick}
                        />
                      </div>
                      <CalendarStatistics
                        teamId={selectedTeamId}
                        tournamentId={selectedTeam.tournamentId}
                      />
                    </>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="list">
              {!user ? (
                <div className="rounded-lg border border-dashed">
                  <CardContent>
                    <Empty className="gap-3 py-4!">
                      <EmptyMedia>
                        <List className="text-muted-foreground size-12" />
                      </EmptyMedia>
                      <EmptyHeader>Loading...</EmptyHeader>
                    </Empty>
                  </CardContent>
                </div>
              ) : (
                <SubmissionCardList
                  submissions={augmentSubmissions(submissions)}
                  currentUser={user}
                  onEdit={(id) => {
                    const submission = submissions.find((s) => s._id === id);
                    setSelectedSubmission(submission);
                    setUpsertSubmissionOpen(true);
                  }}
                  onDelete={(id) => remove({ submissionId: id })}
                />
              )}
            </TabsContent>
          </Tabs>
        </section>
      )}

      {/* Empty state — no role or team membership */}
      {!canManage && !canReview && !isPlayer && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Join a tournament team to start submitting activities.
          </p>
        </div>
      )}
    </>
  );
}
