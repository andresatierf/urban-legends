import { useState } from "react";

import { Confetti } from "@/components/ui/confetti";
import { FooterRibbon } from "@/components/ui/footer-ribbon";
import { RibbonBanner } from "@/components/ui/ribbon-banner";

import { CoachStat } from "./coach-stat";
import { DashboardTeamCard } from "./dashboard-team-card";
import { LogActivityFab } from "./log-activity-fab";
import { MetricTile, RosetteTile } from "./metric-tile";
import { StandingsRaceCard } from "./standings-race-card";
import { StatChip } from "./stat-chip";
import {
  StopwatchSvg,
  TrophySvg,
  WhistleSvg,
  WhistleSvgSmall,
} from "./svg-icons";
import { TournamentSwitcher } from "./tournament-switcher";
import { DashboardData } from "./types";
import {
  activityDotColorClass,
  buildStandingsChartData,
  buildStandingsGroups,
  countApprovedSince,
  countApprovedToday,
  formatRelative,
  getActiveTeams,
  getApprovedSparkline,
  getMvpEntry,
  getStreakDays,
  getStreakSparkline,
  getTournamentProgress,
  getWeekNumber,
  getWeekStartMs,
  isTournamentActive,
  sortByPointsDesc,
  toIsoDate,
} from "./utils";

export function DashboardLayout({ data }: { data: DashboardData }) {
  const today = new Date();
  const todayStr = toIsoDate(today);
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const weekNo = getWeekNumber(today);
  const activeTeams = getActiveTeams(data.teams, todayStr);
  const standings = sortByPointsDesc(data.teams);

  const mvpEntry = getMvpEntry(data.teams, data.activities, todayStr);
  const mvpTeam = mvpEntry?.team ?? data.teams[0] ?? null;
  const mvpCountToday = mvpEntry?.submissionsToday ?? 0;
  const mvpCountTotal = mvpEntry?.submissionsAllTime ?? 0;
  const mvpDisplayCount = mvpCountToday > 0 ? mvpCountToday : mvpCountTotal;

  const urgentDeadlines = data.deadlines.filter((d) => d.daysUntilEnd <= 3);
  const nextDeadlineDays =
    data.deadlines.length > 0
      ? Math.min(...data.deadlines.map((d) => d.daysUntilEnd))
      : null;

  const streakDays = getStreakDays(data.activities, today);
  const weekApproved = countApprovedSince(
    data.activities,
    getWeekStartMs(today),
  );
  const todayApproved = countApprovedToday(data.activities, todayStr);

  const userTopTeam = standings.length > 0 ? standings[0] : null;
  const squadRank = userTopTeam
    ? standings.findIndex((t) => t.team._id === userTopTeam.team._id) + 1
    : 1;

  const sparkline = getApprovedSparkline(data.activities, today);
  const streakSparkline = getStreakSparkline(data.activities, today);

  const standingsGroups = buildStandingsGroups(
    [...data.teams, ...data.competingTeams],
    todayStr,
  );

  const defaultTourId =
    activeTeams[0]?.tournament._id ?? standingsGroups[0]?.tournament._id ?? "";
  const [selectedTourId, setSelectedTourId] = useState<string>(defaultTourId);
  const selectedGroup =
    standingsGroups.find((g) => g.tournament._id === selectedTourId) ??
    standingsGroups[0] ??
    null;
  const selectedTour = selectedGroup?.tournament ?? null;
  const isSelectedActive = selectedTour
    ? isTournamentActive(selectedTour, todayStr)
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

  const chartData = selectedGroup
    ? buildStandingsChartData(selectedGroup, data.standingsTimelines, today)
    : null;

  const hasInbox =
    data.invitations.length > 0 ||
    data.joinRequests.length > 0 ||
    data.pendingSubmissions.length > 0 ||
    urgentDeadlines.length > 0;

  return (
    <div className="relative p-6 pb-10">
      <section className="border-ink bg-card shadow-fd-lg relative mt-3 rounded-2xl border-2 pt-12 pr-8 pb-8 pl-8 text-center sm:mb-5 sm:pb-[4.5rem]">
        <Confetti />
        {selectedTour && data.activeTournaments.length > 1 && (
          <div className="-mt-4 mb-6 flex justify-center sm:mb-0">
            <TournamentSwitcher
              tournaments={data.activeTournaments}
              selectedTournamentId={selectedTour._id}
              onSelect={setSelectedTourId}
              className="sm:absolute sm:-top-4 sm:left-5 sm:z-3"
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
            className="sm:absolute sm:right-5 sm:-bottom-9.5 sm:z-3"
          />
        )}
      </section>

      {selectedGroup && (
        <section
          className="relative mt-15 animate-[va-fadein-up_0.4s_ease_both] motion-reduce:animate-none"
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
        <section className="relative mt-5">
          <RibbonBanner label="MY SQUADS" small />
          <div className="grid grid-cols-1 gap-4">
            {data.teams.map((t) => {
              const progress = getTournamentProgress(t.tournament, Date.now());
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

      <div className="relative mt-5 grid grid-cols-1 gap-5 min-[960px]:grid-cols-2">
        {selectedUserTeam && selectedRival && (
          <section className="relative mt-0 flex flex-col">
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
                  className={`border-ink text-label-caps rounded-full border-[1.5px] px-2.5 py-1 ${selectedRivalDelta >= 0 ? "bg-grass/25" : "bg-sunset/20"}`}
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

        <section className="relative mt-0 flex flex-col">
          <RibbonBanner label="SQUAD OF THE DAY" small />
          <div className="border-ink bg-grass shadow-fd-lg flex items-center gap-8 rounded-2xl border-2 p-8">
            <div aria-hidden className="flex-shrink-0">
              <TrophySvg />
            </div>
            <div className="flex-1">
              <div className="text-ink text-label-caps mb-[0.4rem] opacity-75">
                Star Crew
              </div>
              <div className="text-ink text-h1 mb-[0.45rem]">
                {mvpTeam ? mvpTeam.team.name : "No teams yet"}
              </div>
              {mvpTeam ? (
                <>
                  <p className="text-ink text-body-md m-0 leading-[1.5] opacity-80">
                    {mvpDisplayCount} submission
                    {mvpDisplayCount === 1 ? "" : "s"}{" "}
                    {mvpCountToday > 0 ? "today" : "this period"} ·{" "}
                    <strong>{mvpTeam.tournament.name}</strong>
                  </p>
                  <p className="text-ink text-body-md m-0 leading-[1.5] opacity-80">
                    {mvpTeam.memberCount} member
                    {mvpTeam.memberCount === 1 ? "" : "s"}
                    {mvpTeam.userRole === "captain" && (
                      <span className="border-gold text-ink text-label-caps bg-gold/30 mt-[0.35rem] ml-[0.35rem] inline-flex items-center gap-[3px] rounded-full border-[1.5px] px-2 py-0.5">
                        <WhistleSvgSmall />
                        Captain
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-ink text-body-md m-0 leading-[1.5] opacity-80">
                  Join a tournament to compete.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="relative mt-5 grid grid-cols-1 gap-5 min-[960px]:grid-cols-2">
        <section
          className="relative mt-0 flex [animation:va-fadein-up_0.4s_ease_both] flex-col motion-reduce:animate-none"
          style={{ animationDelay: "100ms" }}
        >
          <RibbonBanner label="FIELD STATS" small />
          <div className="grid grid-cols-2 gap-[0.85rem]">
            <MetricTile
              label="STREAK"
              value={streakDays}
              unit="DAYS"
              color="var(--sky)"
              sparkline={streakSparkline}
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
          <section className="relative mt-0 flex flex-col">
            <RibbonBanner label="HIGHLIGHTS FROM THE FIELD" small />
            <div className="border-ink bg-card shadow-fd-lg before:border-ink/20 relative overflow-hidden rounded-2xl border-2 p-6 pl-8 before:absolute before:top-6 before:bottom-6 before:left-[1.85rem] before:w-0 before:border-l-2 before:border-dashed before:content-['']">
              {data.activities.map((a, i) => {
                const dotColorClass = activityDotColorClass(a.type);
                return (
                  <div
                    key={i}
                    className="relative grid grid-cols-[3.5rem_1fr] gap-x-3 py-[0.6rem]"
                  >
                    <div
                      className={`border-card ring-ink absolute top-1/2 -left-[1.65rem] size-[10px] -translate-y-1/2 rounded-full border-2 ring-2 ${dotColorClass}`}
                      aria-hidden
                    />
                    <div className="text-mute pt-[0.1rem] font-mono text-xs whitespace-nowrap">
                      {formatRelative(a.timestamp)}
                    </div>
                    <div className="text-ink text-body-sm leading-[1.4]">
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
        <section className="relative mt-5">
          <RibbonBanner label="INBOX" small />
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-[0.85rem]">
              {data.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="border-ink bg-card shadow-fd rounded-xl border-2 px-5 py-4"
                >
                  <div className="border-gold text-label-caps bg-gold/35 mb-2 inline-block rounded-full border-[1.5px] px-2.5 py-0.5">
                    RSVP
                  </div>
                  <div className="font-heading text-h3 mb-[0.2rem] font-bold">
                    {inv.teamName}
                  </div>
                  <div className="text-mute text-body-sm mb-[0.2rem]">
                    {inv.tournamentName} · invited by {inv.invitedBy}
                  </div>
                  <div className="text-mute mb-3 font-mono text-xs">
                    {formatRelative(inv.timestamp)}
                  </div>
                  <div className="flex gap-2">
                    <button className="border-ink bg-sunset text-body-sm hover:shadow-fd-sm cursor-pointer rounded-full border-2 px-4 py-1.5 font-semibold text-white transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px">
                      COUNT ME IN
                    </button>
                    <button className="border-ink bg-paper-deep text-ink text-body-sm hover:shadow-fd-sm cursor-pointer rounded-full border-2 px-4 py-1.5 font-semibold transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px">
                      MAYBE NEXT TIME
                    </button>
                  </div>
                </div>
              ))}
              {data.joinRequests.map((jr) => (
                <div
                  key={jr.id}
                  className="border-ink bg-card shadow-fd rounded-xl border-2 px-5 py-4"
                >
                  <div className="border-plum text-label-caps bg-plum/15 mb-2 inline-block rounded-full border-[1.5px] px-2.5 py-0.5">
                    JOIN REQUEST
                  </div>
                  <div className="font-heading text-h3 mb-[0.2rem] font-bold">
                    {jr.userName}
                  </div>
                  <div className="text-mute text-body-sm mb-[0.2rem]">
                    wants to join {jr.teamName}
                  </div>
                  <div className="text-mute mb-3 font-mono text-xs">
                    {formatRelative(jr.timestamp)}
                  </div>
                  <div className="flex gap-2">
                    <button className="border-ink bg-sunset text-body-sm hover:shadow-fd-sm cursor-pointer rounded-full border-2 px-4 py-1.5 font-semibold text-white transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px">
                      WELCOME ABOARD
                    </button>
                    <button className="border-ink bg-paper-deep text-ink text-body-sm hover:shadow-fd-sm cursor-pointer rounded-full border-2 px-4 py-1.5 font-semibold transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-px hover:-translate-y-px">
                      NOT TODAY
                    </button>
                  </div>
                </div>
              ))}
              {data.invitations.length === 0 &&
                data.joinRequests.length === 0 && (
                  <div className="border-mute text-mute text-body-sm rounded-xl border-2 border-dashed p-5 text-center opacity-70">
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
                    className="border-ink bg-card shadow-fd flex items-start gap-[0.85rem] rounded-xl border-2 px-5 py-4"
                  >
                    <WhistleSvg />
                    <div className="flex-1">
                      <div className="font-heading text-body-md mb-[0.15rem] font-bold">
                        {s.teamName}
                      </div>
                      <div className="text-mute text-body-sm mb-[0.2rem]">
                        {s.tournamentName}
                      </div>
                      <div className="text-mute font-mono text-xs">
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
                  className="border-crimson bg-crimson/5 shadow-fd flex items-start gap-[0.85rem] rounded-xl border-2 px-5 py-4"
                >
                  <StopwatchSvg urgent />
                  <div className="flex-1">
                    <div className="font-heading text-body-md mb-[0.15rem] font-bold">
                      {d.tournament.name}
                    </div>
                    <div className="text-crimson font-mono text-xs font-medium">
                      Final whistle in {d.daysUntilEnd} day
                      {d.daysUntilEnd === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              ))}
              {data.pendingSubmissions.length === 0 &&
                urgentDeadlines.length === 0 && (
                  <div className="border-mute text-mute text-body-sm rounded-xl border-2 border-dashed p-5 text-center opacity-70">
                    Queue is clear — nothing pending.
                  </div>
                )}
            </div>
          </div>
        </section>
      )}

      {data.isAdmin && data.adminStats && (
        <section className="relative mt-5">
          <RibbonBanner label="COACH'S CLIPBOARD" small />
          <div className="border-ink bg-paper-deep shadow-fd-lg rounded-2xl border-2 p-7">
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
