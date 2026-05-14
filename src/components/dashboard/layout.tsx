import { useState } from "react";

import { CoachStat } from "./coach-stat";
import { Confetti } from "./confetti";
import { DashboardTeamCard } from "./dashboard-team-card";
import { FooterRibbon } from "./footer-ribbon";
import { LogActivityFab } from "./log-activity-fab";
import { MetricTile, RosetteTile } from "./metric-tile";
import { RibbonBanner } from "./ribbon-banner";
import { StandingsRaceCard } from "./standings-race-card";
import { StatChip } from "./stat-chip";
import {
  StopwatchSvg,
  TrophySvg,
  WhistleSvg,
  WhistleSvgSmall,
} from "./svg-icons";
import { TournamentSwitcher } from "./tournament-switcher";
import { DashboardData, DashboardTeam } from "./types";
import { activityDotColorClass, formatRelative } from "./utils";

export function DashboardLayout({ data }: { data: DashboardData }) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((today.getTime() - startOfYear.getTime()) / 86_400_000 +
      startOfYear.getDay() +
      1) /
      7,
  );

  const activeTeams = data.teams.filter(
    (t) =>
      t.tournament.startDate <= todayStr && t.tournament.endDate >= todayStr,
  );

  const standings = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );

  const mvpStats = data.teams.map((t) => ({
    team: t,
    submissionsToday: data.activities.filter(
      (a) =>
        a.type === "submission_approved" &&
        a.description.includes(t.team.name) &&
        new Date(a.timestamp).toISOString().slice(0, 10) === todayStr,
    ).length,
    submissionsAllTime: data.activities.filter(
      (a) =>
        a.type === "submission_approved" && a.description.includes(t.team.name),
    ).length,
  }));
  const mvpEntry =
    [...mvpStats].sort(
      (a, b) =>
        b.submissionsToday - a.submissionsToday ||
        b.submissionsAllTime - a.submissionsAllTime ||
        b.team.team.points - a.team.team.points,
    )[0] ?? null;
  const mvpTeam = mvpEntry?.team ?? data.teams[0] ?? null;
  const mvpCountToday = mvpEntry?.submissionsToday ?? 0;
  const mvpCountTotal = mvpEntry?.submissionsAllTime ?? 0;
  const mvpDisplayCount = mvpCountToday > 0 ? mvpCountToday : mvpCountTotal;

  const urgentDeadlines = data.deadlines.filter((d) => d.daysUntilEnd <= 3);
  const nextDeadlineDays =
    data.deadlines.length > 0
      ? Math.min(...data.deadlines.map((d) => d.daysUntilEnd))
      : null;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const activeDaySet = new Set(
    data.activities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = last7.filter((d) => activeDaySet.has(d)).length;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" && a.timestamp >= weekStart.getTime(),
  ).length;

  const todayApproved = data.activities.filter((a) => {
    const d = new Date(a.timestamp).toISOString().slice(0, 10);
    return a.type === "submission_approved" && d === todayStr;
  }).length;

  const userTopTeam = standings.length > 0 ? standings[0] : null;
  const squadRank = userTopTeam
    ? standings.findIndex((t) => t.team._id === userTopTeam.team._id) + 1
    : 1;

  const sparkline = last7
    .slice()
    .reverse()
    .map(
      (d) =>
        data.activities.filter(
          (a) =>
            a.type === "submission_approved" &&
            new Date(a.timestamp).toISOString().slice(0, 10) === d,
        ).length,
    );

  const allTeams = [...data.teams, ...data.competingTeams];
  type StandingGroup = {
    tournament: DashboardTeam["tournament"];
    teams: DashboardTeam[];
  };
  const standingsGroupsMap = new Map<string, StandingGroup>();
  for (const t of allTeams) {
    const id = t.tournament._id;
    const existing = standingsGroupsMap.get(id);
    if (existing) {
      existing.teams.push(t);
    } else {
      standingsGroupsMap.set(id, { tournament: t.tournament, teams: [t] });
    }
  }
  const standingsGroups = [...standingsGroupsMap.values()].map((g) => ({
    tournament: g.tournament,
    teams: [...g.teams].sort((a, b) => b.team.points - a.team.points),
    maxPts: Math.max(...g.teams.map((x) => x.team.points), 1),
  }));
  standingsGroups.sort((a, b) => {
    const aActive =
      a.tournament.startDate <= todayStr && a.tournament.endDate >= todayStr
        ? 0
        : 1;
    const bActive =
      b.tournament.startDate <= todayStr && b.tournament.endDate >= todayStr
        ? 0
        : 1;
    return aActive - bActive;
  });

  const defaultTourId =
    activeTeams[0]?.tournament._id ?? standingsGroups[0]?.tournament._id ?? "";
  const [selectedTourId, setSelectedTourId] = useState<string>(defaultTourId);
  const selectedGroup =
    standingsGroups.find((g) => g.tournament._id === selectedTourId) ??
    standingsGroups[0] ??
    null;
  const selectedTour = selectedGroup?.tournament ?? null;
  const isSelectedActive = selectedTour
    ? selectedTour.startDate <= todayStr && selectedTour.endDate >= todayStr
    : false;
  const selectedUserTeam = selectedGroup
    ? (selectedGroup.teams.find((t) => t.userRole !== "rival") ??
      selectedGroup.teams[0] ??
      null)
    : null;
  const selectedRival = selectedGroup
    ? (selectedGroup.teams.find(
        (t) => t.team._id !== selectedUserTeam?.team._id,
      ) ?? null)
    : null;
  const selectedRivalDelta =
    selectedUserTeam && selectedRival
      ? selectedUserTeam.team.points - selectedRival.team.points
      : 0;

  let chartData: {
    days: number[];
    maxPoints: number;
    series: Array<{
      teamId: string;
      teamName: string;
      points: number[];
      total: number;
    }>;
  } | null = null;
  if (selectedGroup) {
    const startMs = new Date(selectedGroup.tournament.startDate).getTime();
    const endMs = Math.min(
      new Date(selectedGroup.tournament.endDate).getTime(),
      today.getTime(),
    );
    const totalDays = Math.max(Math.ceil((endMs - startMs) / 86_400_000), 1);
    const days = Array.from(
      { length: totalDays + 1 },
      (_, i) => startMs + i * 86_400_000,
    );
    const timelinesByTeam = new Map(
      data.standingsTimelines.map((tl) => [tl.teamId, tl.events]),
    );
    const series = selectedGroup.teams.map((t) => {
      const events = (timelinesByTeam.get(t.team._id) ?? []).filter(
        (e) => e.timestamp >= startMs && e.timestamp <= endMs,
      );
      const points = days.map((d) =>
        events.reduce((sum, e) => (e.timestamp <= d ? sum + e.points : sum), 0),
      );
      if (points.length > 0 && events.length > 0) {
        points[points.length - 1] = t.team.points;
      }
      return {
        teamId: t.team._id,
        teamName: t.team.name,
        points,
        total: t.team.points,
      };
    });
    const maxPoints = Math.max(...series.flatMap((s) => s.points), 1);
    chartData = { days, maxPoints, series };
  }

  const hasInbox =
    data.invitations.length > 0 ||
    data.joinRequests.length > 0 ||
    data.pendingSubmissions.length > 0 ||
    urgentDeadlines.length > 0;

  return (
    <div className="relative [padding:1.5rem_1.5rem_2.5rem]">
      <section className="border-ink bg-card relative z-[1] mt-3 rounded-[22px] border-2 pt-12 pr-8 pb-8 pl-8 text-center shadow-[6px_6px_0_var(--shadow)] sm:mb-5 sm:pb-[4.5rem]">
        <Confetti />
        {selectedTour && data.activeTournaments.length > 1 && (
          <div className="-mt-4 mb-6 flex justify-center sm:mb-0">
            <TournamentSwitcher
              tournaments={data.activeTournaments}
              selectedTournamentId={selectedTour._id}
              onSelect={setSelectedTourId}
              className="sm:absolute sm:-top-5 sm:left-5 sm:z-[3]"
            />
          </div>
        )}
        <RibbonBanner label={`WEEK ${weekNo} · FIELD DAY`} />
        <h1 className="text-ink text-h1 mt-4 mb-[0.45rem] text-[clamp(1.75rem,4vw,2.8rem)]">
          Welcome to the field, {data.userName} 🎽
        </h1>
        <p className="text-mute text-body-md m-0 mb-7 text-[1.05rem]">
          Here&apos;s how today&apos;s shaping up.
        </p>

        <div className="grid grid-cols-2 gap-[0.85rem] sm:grid-cols-4">
          <StatChip
            label="DAY STREAK"
            value={streakDays}
            accent={streakDays >= 3}
          />
          <StatChip label="APPROVED TODAY" value={todayApproved} />
          <StatChip
            label="YOUR BEST RANK"
            value={squadRank}
            suffix={`/${Math.max(standings.length, 1)}`}
          />
          <StatChip
            label="NEXT WHISTLE"
            value={nextDeadlineDays ?? "—"}
            suffix={
              nextDeadlineDays != null
                ? nextDeadlineDays === 1
                  ? "DAY"
                  : "DAYS"
                : undefined
            }
            accent={nextDeadlineDays != null && nextDeadlineDays <= 3}
          />
        </div>

        {selectedTour && isSelectedActive && selectedUserTeam && (
          <LogActivityFab
            teamName={selectedUserTeam.team.name}
            tournamentName={selectedTour.name}
            className="sm:absolute sm:right-5 sm:bottom-[-38px] sm:z-[3]"
          />
        )}
      </section>

      {selectedGroup && (
        <section
          className="relative z-[1] mt-15 [animation:va-fadein-up_0.4s_ease_both] motion-reduce:animate-none"
          style={{ animationDelay: "120ms" }}
        >
          <RibbonBanner label="Standings" />
          <StandingsRaceCard
            group={selectedGroup}
            isActive={isSelectedActive}
            chartData={chartData}
            userTeamId={selectedUserTeam?.team._id}
          />
        </section>
      )}

      {data.teams.length > 0 && (
        <section className="relative z-[1] mt-5">
          <RibbonBanner label="MY SQUADS" small />
          <div className="grid grid-cols-1 gap-4">
            {data.teams.map((t) => {
              const tournStart = new Date(t.tournament.startDate).getTime();
              const tournEnd = new Date(t.tournament.endDate).getTime();
              const now = Date.now();
              const totalDuration = Math.max(tournEnd - tournStart, 1);
              const elapsed = Math.min(
                Math.max(now - tournStart, 0),
                totalDuration,
              );
              const progress = Math.round((elapsed / totalDuration) * 100);
              return (
                <DashboardTeamCard
                  key={t.team._id}
                  name={t.team.name}
                  tournamentName={t.tournament.name}
                  points={t.team.points}
                  memberCount={t.memberCount}
                  isCaptain={t.userRole === "captain"}
                  progress={progress}
                />
              );
            })}
          </div>
        </section>
      )}

      <div className="relative z-[1] mt-5 grid grid-cols-1 gap-5 min-[960px]:grid-cols-2">
        {selectedUserTeam && selectedRival && (
          <section className="relative z-[1] mt-0 flex flex-col">
            <RibbonBanner label="TALE OF THE TAPE" small />
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <RosetteTile team={selectedUserTeam} label="YOU" highlight />
              <div className="relative flex flex-shrink-0 flex-col items-center gap-2">
                <svg aria-hidden width="56" height="56" viewBox="0 0 56 56">
                  <path
                    d="M4 4 L52 4 L52 52 L4 52 Z"
                    fill="var(--gold)"
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    transform="rotate(45 28 28) scale(0.68) translate(8 8)"
                  />
                </svg>
                <span className="text-ink font-heading pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.1rem] font-extrabold">
                  VS
                </span>
                <div
                  className={`border-ink text-label-caps rounded-full border-[1.5px] [padding:0.2rem_0.6rem] text-[0.6rem] ${selectedRivalDelta >= 0 ? "bg-[rgba(93,199,122,0.25)]" : "bg-[rgba(255,122,69,0.2)]"}`}
                >
                  {selectedRivalDelta >= 0
                    ? `AHEAD BY ${selectedRivalDelta}`
                    : `BEHIND BY ${Math.abs(selectedRivalDelta)}`}
                </div>
              </div>
              <RosetteTile team={selectedRival} label="RIVAL" />
            </div>
          </section>
        )}

        <section className="relative z-[1] mt-0 flex flex-col">
          <RibbonBanner label="SQUAD OF THE DAY" small />
          {mvpTeam ? (
            <div className="border-ink bg-grass flex items-center gap-8 rounded-[22px] border-2 p-8 shadow-[6px_6px_0_var(--shadow)]">
              <div aria-hidden className="flex-shrink-0">
                <TrophySvg />
              </div>
              <div className="flex-1">
                <div className="text-ink text-label-caps mb-[0.4rem] text-[0.7rem] opacity-75">
                  Star Crew
                </div>
                <div className="text-ink text-h1 mb-[0.45rem] text-[clamp(1.6rem,4vw,2.4rem)]">
                  {mvpTeam.team.name}
                </div>
                <p className="text-ink text-body-md m-0 text-[0.95rem] leading-[1.5] opacity-80">
                  {mvpDisplayCount} submission
                  {mvpDisplayCount === 1 ? "" : "s"}{" "}
                  {mvpCountToday > 0 ? "today" : "this period"} ·{" "}
                  <strong>{mvpTeam.tournament.name}</strong>
                </p>
                <p className="text-ink text-body-md m-0 text-[0.95rem] leading-[1.5] opacity-80">
                  {mvpTeam.memberCount} member
                  {mvpTeam.memberCount === 1 ? "" : "s"}
                  {mvpTeam.userRole === "captain" && (
                    <span className="border-gold text-ink text-label-caps mt-[0.35rem] ml-[0.35rem] inline-flex items-center gap-[3px] rounded-full border-[1.5px] bg-[rgba(255,200,71,0.3)] [padding:0.15rem_0.5rem] text-[0.65rem]">
                      <WhistleSvgSmall />
                      Captain
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="border-ink bg-grass flex items-center gap-8 rounded-[22px] border-2 p-8 shadow-[6px_6px_0_var(--shadow)]">
              <div aria-hidden className="flex-shrink-0">
                <TrophySvg />
              </div>
              <div className="flex-1">
                <div className="text-ink text-label-caps mb-[0.4rem] text-[0.7rem] opacity-75">
                  Star Crew
                </div>
                <div className="text-ink text-h1 mb-[0.45rem] text-[clamp(1.6rem,4vw,2.4rem)]">
                  No teams yet
                </div>
                <p className="text-ink text-body-md m-0 text-[0.95rem] leading-[1.5] opacity-80">
                  Join a tournament to compete.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="relative z-[1] mt-5 grid grid-cols-1 gap-5 min-[960px]:grid-cols-2">
        <section
          className="relative z-[1] mt-0 flex [animation:va-fadein-up_0.4s_ease_both] flex-col motion-reduce:animate-none"
          style={{ animationDelay: "100ms" }}
        >
          <RibbonBanner label="FIELD STATS" small />
          <div className="grid grid-cols-2 gap-[0.85rem]">
            <MetricTile
              label="STREAK"
              value={streakDays}
              unit="DAYS"
              color="var(--sky)"
              sparkline={last7
                .slice()
                .reverse()
                .map((d) => (activeDaySet.has(d) ? 1 : 0))}
            />
            <MetricTile
              label="THIS WEEK"
              value={weekApproved}
              unit="APPROVED"
              color="var(--grass)"
              sparkline={sparkline}
            />
            <MetricTile
              label="TODAY"
              value={todayApproved}
              unit="LOGGED"
              color="var(--sunset)"
              sparkline={sparkline}
            />
            <MetricTile
              label="SQUAD RANK"
              value={squadRank}
              unit={`OF ${Math.max(standings.length, 1)}`}
              color="var(--plum)"
              sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
            />
          </div>
        </section>

        {data.activities.length > 0 && (
          <section className="relative z-[1] mt-0 flex flex-col">
            <RibbonBanner label="HIGHLIGHTS FROM THE FIELD" small />
            <div className="border-ink bg-card relative overflow-hidden rounded-[22px] border-2 [padding:1.5rem_1.5rem_1.5rem_2rem] shadow-[6px_6px_0_var(--shadow)] before:absolute before:top-6 before:bottom-6 before:left-[1.85rem] before:w-0 before:border-l-2 before:border-dashed before:border-[rgba(var(--ink-rgb),0.2)] before:content-['']">
              {data.activities.map((a, i) => {
                const dotColorClass = activityDotColorClass(a.type);
                return (
                  <div
                    key={i}
                    className="relative grid grid-cols-[3.5rem_1fr] gap-x-3 py-[0.6rem]"
                  >
                    <div
                      className={`border-card absolute top-1/2 -left-[1.65rem] size-[10px] -translate-y-1/2 rounded-full border-2 shadow-[0_0_0_2px_var(--ink)] ${dotColorClass}`}
                      aria-hidden
                    />
                    <div className="text-mute pt-[0.1rem] font-mono text-[0.68rem] whitespace-nowrap">
                      {formatRelative(a.timestamp)}
                    </div>
                    <div className="text-ink text-body-sm text-[0.9rem] leading-[1.4]">
                      {a.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {hasInbox && (
        <section className="relative z-[1] mt-5">
          <RibbonBanner label="INBOX" small />
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-[0.85rem]">
              {data.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="border-ink bg-card rounded-[16px] border-2 [padding:1.1rem_1.25rem] shadow-[4px_4px_0_var(--shadow)]"
                >
                  <div className="border-gold text-label-caps mb-2 inline-block rounded-full border-[1.5px] bg-[rgba(255,200,71,0.35)] [padding:0.15rem_0.6rem] text-[0.62rem]">
                    RSVP
                  </div>
                  <div className="font-heading mb-[0.2rem] text-[1.1rem] font-bold">
                    {inv.teamName}
                  </div>
                  <div className="text-mute text-body-sm mb-[0.2rem] text-[0.82rem]">
                    {inv.tournamentName} · invited by {inv.invitedBy}
                  </div>
                  <div className="text-mute mb-3 font-mono text-[0.7rem]">
                    {formatRelative(inv.timestamp)}
                  </div>
                  <div className="flex gap-2">
                    <button className="border-ink bg-sunset text-body-sm cursor-pointer rounded-full border-2 [padding:0.35rem_1rem] text-[0.82rem] font-semibold text-white transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--ink)]">
                      COUNT ME IN
                    </button>
                    <button className="border-ink bg-paper-deep text-ink text-body-sm cursor-pointer rounded-full border-2 [padding:0.35rem_1rem] text-[0.82rem] font-semibold transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--ink)]">
                      MAYBE NEXT TIME
                    </button>
                  </div>
                </div>
              ))}
              {data.joinRequests.map((jr) => (
                <div
                  key={jr.id}
                  className="border-ink bg-card rounded-[16px] border-2 [padding:1.1rem_1.25rem] shadow-[4px_4px_0_var(--shadow)]"
                >
                  <div className="border-plum text-label-caps mb-2 inline-block rounded-full border-[1.5px] bg-[rgba(161,102,212,0.15)] [padding:0.15rem_0.6rem] text-[0.62rem]">
                    JOIN REQUEST
                  </div>
                  <div className="font-heading mb-[0.2rem] text-[1.1rem] font-bold">
                    {jr.userName}
                  </div>
                  <div className="text-mute text-body-sm mb-[0.2rem] text-[0.82rem]">
                    wants to join {jr.teamName}
                  </div>
                  <div className="text-mute mb-3 font-mono text-[0.7rem]">
                    {formatRelative(jr.timestamp)}
                  </div>
                  <div className="flex gap-2">
                    <button className="border-ink bg-sunset text-body-sm cursor-pointer rounded-full border-2 [padding:0.35rem_1rem] text-[0.82rem] font-semibold text-white transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--ink)]">
                      WELCOME ABOARD
                    </button>
                    <button className="border-ink bg-paper-deep text-ink text-body-sm cursor-pointer rounded-full border-2 [padding:0.35rem_1rem] text-[0.82rem] font-semibold transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--ink)]">
                      NOT TODAY
                    </button>
                  </div>
                </div>
              ))}
              {data.invitations.length === 0 &&
                data.joinRequests.length === 0 && (
                  <div className="border-mute text-mute text-body-sm rounded-[14px] border-2 border-dashed p-5 text-center text-[0.85rem] opacity-70">
                    No pending RSVPs — you&apos;re all caught up.
                  </div>
                )}
            </div>

            <div className="flex flex-col gap-[0.85rem]">
              {data.pendingSubmissions.map((s) => {
                const subDate = new Date(s.date);
                const daysAgo = Math.round(
                  (Date.now() - subDate.getTime()) / 86_400_000,
                );
                return (
                  <div
                    key={s.id}
                    className="border-ink bg-card flex items-start gap-[0.85rem] rounded-[16px] border-2 [padding:1rem_1.25rem] shadow-[4px_4px_0_var(--shadow)]"
                  >
                    <WhistleSvg />
                    <div className="flex-1">
                      <div className="font-heading mb-[0.15rem] text-[1rem] font-bold">
                        {s.teamName}
                      </div>
                      <div className="text-mute text-body-sm mb-[0.2rem] text-[0.8rem]">
                        {s.tournamentName}
                      </div>
                      <div className="text-mute font-mono text-[0.72rem]">
                        Logged {daysAgo} day{daysAgo === 1 ? "" : "s"} ago,
                        awaiting whistle
                      </div>
                    </div>
                  </div>
                );
              })}
              {urgentDeadlines.map((d) => (
                <div
                  key={d.tournament._id}
                  className="flex items-start gap-[0.85rem] rounded-[16px] border-2 border-[#e53e3e] bg-[rgba(229,62,62,0.05)] [padding:1rem_1.25rem] shadow-[4px_4px_0_var(--shadow)]"
                >
                  <StopwatchSvg urgent />
                  <div className="flex-1">
                    <div className="font-heading mb-[0.15rem] text-[1rem] font-bold">
                      {d.tournament.name}
                    </div>
                    <div className="font-mono text-[0.72rem] font-medium text-[#e53e3e]">
                      Final whistle in {d.daysUntilEnd} day
                      {d.daysUntilEnd === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              ))}
              {data.pendingSubmissions.length === 0 &&
                urgentDeadlines.length === 0 && (
                  <div className="border-mute text-mute text-body-sm rounded-[14px] border-2 border-dashed p-5 text-center text-[0.85rem] opacity-70">
                    Queue is clear — nothing pending.
                  </div>
                )}
            </div>
          </div>
        </section>
      )}

      {data.isAdmin && data.adminStats && (
        <section className="relative z-[1] mt-5">
          <RibbonBanner label="COACH'S CLIPBOARD" small />
          <div className="border-ink bg-paper-deep rounded-[22px] border-2 [padding:1.75rem] shadow-[6px_6px_0_var(--shadow)]">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <CoachStat
                label="Members"
                value={data.adminStats.users.total}
                sub={`+${data.adminStats.users.newThisWeek} this week`}
                ok
              />
              <CoachStat
                label="Active Challenges"
                value={data.adminStats.tournaments.active}
                sub={`${data.adminStats.tournaments.upcoming} upcoming`}
                ok
              />
              <CoachStat
                label="Review Queue"
                value={data.adminStats.submissions.pending}
                sub="awaiting decision"
                ok={data.adminStats.submissions.pending === 0}
              />
              <CoachStat
                label="Approval Rate"
                value={Math.round(
                  (data.adminStats.submissions.approved /
                    Math.max(
                      data.adminStats.submissions.approved +
                        data.adminStats.submissions.rejected,
                      1,
                    )) *
                    100,
                )}
                unit="%"
                sub={`${data.adminStats.submissions.approved} approved`}
                ok
              />
            </div>
          </div>
        </section>
      )}

      <footer className="mt-10 flex justify-center">
        <FooterRibbon date={dateLabel} />
      </footer>
    </div>
  );
}
