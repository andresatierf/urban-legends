"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Calendar, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { UpsertSubmissionFormDialog } from "@/components/form/upsert-submission-form";
import { CalendarStatistics } from "@/components/submissions/listing/calendar/calendar-statistics";
import { SubmissionCalendar } from "@/components/submissions/listing/calendar/submission-calendar";
import { SubmissionCardList } from "@/components/submissions/listing/card/submission-card-list";
import { TeamSelector } from "@/components/submissions/listing/team-selector";
import { CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";

type Props = {
  user: UserWithRoles;
};

export function PlayerSection({ user }: Props) {
  const navigate = useNavigate();
  const remove = useMutation(api.submissions.remove);

  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams">>();
  const [selectedSubmission, setSelectedSubmission] =
    useState<Doc<"submissions">>();
  const [selectedDate, setSelectedDate] = useState<string>();
  const [upsertSubmissionOpen, setUpsertSubmissionOpen] = useState(false);

  const submissions =
    useQuery(api.submissions.list, {
      userId: user._id,
      state: ["approved", "pending", "rejected"],
    }) || [];

  const userTeams = useQuery(api.teams.list, { userId: user._id });
  const tournaments = useQuery(api.tournaments.list, {}) || [];
  const tournamentIdMap = useMemo(
    () =>
      tournaments.reduce<Map<Id<"tournaments">, Doc<"tournaments">>>(
        (acc, tournament) => acc.set(tournament._id, tournament),
        new Map(),
      ),
    [tournaments],
  );

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
  const teamIdMap = useMemo(
    () =>
      teams.reduce<Map<Id<"teams">, Doc<"teams">>>(
        (acc, team) => acc.set(team._id, team),
        new Map(),
      ),
    [teams],
  );

  const users = useQuery(api.users.list, {}) || [];
  const userIdMap = useMemo(
    () =>
      users.reduce<Map<Id<"users">, Doc<"users">>>(
        (acc, u) => acc.set(u._id, u),
        new Map(),
      ),
    [users],
  );

  const augmentedSubmissions = useMemo(
    () =>
      submissions
        .map((submission) => {
          const team = teamIdMap.get(submission.teamId);
          const submissionUser = userIdMap.get(submission.userId);
          if (!team || !submissionUser) return null;
          return { ...submission, team, user: submissionUser };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    [submissions, teamIdMap, userIdMap],
  );

  const allSubmissions = useQuery(api.submissions.list, {}) || [];

  const handleDateClick = useCallback(
    (date: string, submissionId?: Id<"submissions">) => {
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
    },
    [allSubmissions, navigate],
  );

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedSubmission(undefined);
      setSelectedDate(undefined);
    }
    setUpsertSubmissionOpen(newOpen);
  };

  return (
    <section className="space-y-4">
      <UpsertSubmissionFormDialog
        open={upsertSubmissionOpen}
        onOpenChange={handleClose}
        teamId={selectedTeamId}
        submission={selectedSubmission}
        date={selectedDate}
      />

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
                    You're not part of any teams. Join or create a team to start
                    tracking your submissions.
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
          <SubmissionCardList
            submissions={augmentedSubmissions}
            currentUser={user}
            onEdit={(id) => {
              const submission = submissions.find((s) => s._id === id);
              setSelectedSubmission(submission);
              setUpsertSubmissionOpen(true);
            }}
            onDelete={(id) => remove({ submissionId: id })}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
