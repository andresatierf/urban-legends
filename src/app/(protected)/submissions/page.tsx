"use client";

import { useMutation, useQuery } from "convex/react";
import { Calendar, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UpsertSubmissionFormDialog } from "@/components/form/upsert-submission-form";
import { SectionHeader } from "@/components/section-header";
import { CalendarStatistics } from "@/components/submissions/calendar-statistics";
import { SubmissionCalendar } from "@/components/submissions/submission-calendar";
import { SubmissionCardList } from "@/components/submissions/submission-card-list";
import { TeamSelector } from "@/components/submissions/team-selector";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export default function SubmissionsPage() {
  const { user, isAdmin, isTournamentManager } = useUser();
  const router = useRouter();

  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);
  const remove = useMutation(api.submissions.remove);

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
  const allSubmissions = useQuery(api.submissions.list, {}) || [];

  const pendingSubmissions = allSubmissions.filter(
    (s) => s.state === "pending",
  );
  // const approvedSubmissions = allSubmissions.filter(
  //   (s) => s.state === "approved",
  // );
  // const rejectedSubmissions = allSubmissions.filter(
  //   (s) => s.state === "rejected",
  // );

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
      (acc, user) => acc.set(user._id, user),
      new Map(),
    );
  }, [users]);

  const augmentSubmissions = useCallback(
    (subs: Doc<"submissions">[]) =>
      subs
        .map((submission) => {
          const team = teamIdMap.get(submission.teamId);
          const user = userIdMap.get(submission.userId);

          if (!team || !user) {
            console.error(
              "Missing team or user for submission",
              submission._id,
            );
            return null;
          }

          return {
            ...submission,
            team,
            user,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    [teamIdMap, userIdMap],
  );

  const handleDateClick = (date: string, submissionId?: Id<"submissions">) => {
    if (!allSubmissions) return;

    if (!submissionId) {
      setSelectedSubmission(undefined);
      setSelectedDate(date);
      setUpsertSubmissionOpen(true);
      return;
    }

    const submission = allSubmissions.find((s) => s._id === submissionId);

    if (submission?.state === "approved") {
      router.push(`/submissions/${submission._id}`);
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

  return (
    <>
      <SectionHeader as="h1" title="Submissions">
        <UpsertSubmissionFormDialog
          open={upsertSubmissionOpen}
          onOpenChange={handleClose}
          teamId={selectedTeamId ?? undefined}
          submission={selectedSubmission ?? undefined}
          date={selectedDate ?? undefined}
        />
      </SectionHeader>
      <Tabs defaultValue="calendar">
        <div className="flex items-start justify-between">
          <TabsList>
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
            {teamsWithTournaments.length > 1 && (
              <div className="flex justify-end">
                <TeamSelector
                  teams={teamsWithTournaments}
                  selectedTeamId={selectedTeamId}
                  onTeamChange={setSelectedTeamId}
                />
              </div>
            )}
          </TabsContent>
        </div>
        <TabsContent value="calendar">
          {teamsWithTournaments.length === 0 ? (
            <Card variant="dashed">
              <CardContent>
                <Empty className="gap-3 py-4!">
                  <EmptyMedia>
                    <Calendar className="size-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyHeader>No Teams Yet</EmptyHeader>
                  <EmptyDescription>
                    You're not part of any teams. Join or create a team to start
                    tracking your submissions.
                  </EmptyDescription>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {selectedTeam?.tournament && selectedTeamId && (
                <>
                  <SubmissionCalendar
                    teamId={selectedTeamId}
                    tournamentId={selectedTeam.tournamentId}
                    onDateClick={handleDateClick}
                  />
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
            <Card variant="dashed">
              <CardContent>
                <Empty className="gap-3 py-4!">
                  <EmptyMedia>
                    <List className="size-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyHeader>Loading...</EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-semibold text-2xl">Your Submissions</h2>
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
              </div>

              {(isAdmin || isTournamentManager) && (
                <>
                  <div className="space-y-4">
                    <h2 className="font-semibold text-2xl">
                      Pending Submissions
                    </h2>
                    <SubmissionCardList
                      submissions={augmentSubmissions(pendingSubmissions)}
                      currentUser={user}
                      onApprove={(id) => approve({ submissionId: id })}
                      onReject={(id) => reject({ submissionId: id })}
                      onDelete={(id) => remove({ submissionId: id })}
                    />
                  </div>

                  <div className="space-y-4">
                    <h2 className="font-semibold text-2xl">All Submissions</h2>
                    <SubmissionCardList
                      submissions={augmentSubmissions(allSubmissions)}
                      currentUser={user}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
