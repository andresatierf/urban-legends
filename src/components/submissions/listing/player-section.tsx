"use client";

import { useMutation, useQuery } from "convex/react";
import { Calendar } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { UpsertSubmissionFormDialog } from "@/components/form/upsert-submission-form";
import { CalendarStatistics } from "@/components/submissions/listing/calendar/calendar-statistics";
import { DayDetailPanel } from "@/components/submissions/listing/calendar/day-detail-panel";
import { SubmissionCalendar } from "@/components/submissions/listing/calendar/submission-calendar";
import { TeamSelector } from "@/components/submissions/listing/team-selector";
import { CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";

type Props = {
  user: UserWithRoles;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function PlayerSection({ user }: Props) {
  const remove = useMutation(api.submissions.remove);

  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams">>();
  const [selectedSubmission, setSelectedSubmission] =
    useState<Doc<"submissions">>();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
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

  const selectedDaySubmission = useMemo(
    () =>
      submissions.find(
        (s) =>
          s.teamId === selectedTeamId && s.date.slice(0, 10) === selectedDate,
      ),
    [submissions, selectedTeamId, selectedDate],
  );

  const selectedDateIsFuture = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(selectedDate).getTime() > now.getTime();
  }, [selectedDate]);

  const handleDateClick = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedSubmission(undefined);
    }
    setUpsertSubmissionOpen(newOpen);
  };

  const handleSubmit = () => {
    setSelectedSubmission(undefined);
    setUpsertSubmissionOpen(true);
  };

  const handleEdit = () => {
    setSelectedSubmission(selectedDaySubmission);
    setUpsertSubmissionOpen(true);
  };

  const handleDelete = (submissionId: Id<"submissions">) => {
    remove({ submissionId });
  };

  return (
    <section className="space-y-6">
      <UpsertSubmissionFormDialog
        open={upsertSubmissionOpen}
        onOpenChange={handleClose}
        teamId={selectedTeamId}
        submission={selectedSubmission}
        date={selectedDate}
      />

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
        selectedTeam?.tournament &&
        selectedTeamId && (
          <>
            {teamsWithTournaments.length > 1 && (
              <TeamSelector
                teams={teamsWithTournaments}
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
              />
            )}

            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
              <SubmissionCalendar
                teamId={selectedTeamId}
                tournamentId={selectedTeam.tournamentId}
                onDateClick={handleDateClick}
              />
              <DayDetailPanel
                date={selectedDate}
                submission={selectedDaySubmission}
                isFuture={selectedDateIsFuture}
                onSubmit={handleSubmit}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>

            <CalendarStatistics
              teamId={selectedTeamId}
              tournamentId={selectedTeam.tournamentId}
            />
          </>
        )
      )}
    </section>
  );
}
