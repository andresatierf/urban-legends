"use client";

import { useState } from "react";

import type {
  DashboardFixtureData,
  DemoTeam,
} from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";
import { LogActivityFab } from "./log-activity-fab";
import { StandingsRaceCard } from "./standings-race-card";
import { TournamentSwitcher } from "./tournament-switcher";

/**
 * Variant A — Field Day, tightened. Iterated from N: dot-grid notebook
 * background (borrowed from H) over the warm cream paper, and the
 * stacked sections re-organised into a CSS grid with side-by-side
 * panels so the page wastes less vertical space.
 */
export type VariantASquadsSlotContext = {
  data: DashboardFixtureData;
  selectedTournamentTeams: DemoTeam[];
  selectedUserTeam: DemoTeam | null;
  selectedTournamentName: string | null;
  isSelectedActive: boolean;
  activities: DashboardFixtureData["activities"];
};

export function DashboardVariantA({
  data,
  renderSquadsSection,
}: {
  data: DashboardFixtureData;
  renderSquadsSection?: (ctx: VariantASquadsSlotContext) => React.ReactNode;
}) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Week number approximation
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

  // Full standings sorted by points (used for global squadRank metric)
  const standings = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );

  // Team of the Day: team with most approved submissions today, then all-time, then points
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
  // ── Metric card derivations ──
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

  // Sparkline: approved activity count per day for last 7 days (oldest→newest)
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

  // ── Standings grouped by tournament (user's teams + competitors) ──
  const allTeams = [...data.teams, ...data.competingTeams];
  type StandingGroup = {
    tournament: (typeof data.teams)[number]["tournament"];
    teams: typeof data.teams;
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
  // Active groups first, then ended
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

  // ── Selected tournament (single-tournament dashboard with optional switcher) ──
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

  // ── Race chart series: cumulative points per team over tournament span ──
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
    const series = selectedGroup.teams.map((t) => {
      const teamActivities = data.activities
        .filter(
          (a) =>
            a.type === "submission_approved" &&
            a.description.includes(t.team.name) &&
            a.timestamp >= startMs &&
            a.timestamp <= endMs,
        )
        .sort((a, b) => a.timestamp - b.timestamp);
      const totalCount = teamActivities.length;
      const pointsPerSubmission =
        totalCount > 0 ? t.team.points / totalCount : 0;
      const points = days.map(
        (d) =>
          teamActivities.filter((a) => a.timestamp <= d).length *
          pointsPerSubmission,
      );
      // Ensure end value matches reported team points exactly
      if (points.length > 0 && totalCount > 0) {
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
    <>
      <VariantAStyles />
      <div className="variant-a">
        {/* Dot-grid notebook background */}
        <div className="va-dotgrid" aria-hidden />

        {/* ── 1. HERO ── */}
        <section className="va-hero mt-3">
          <Confetti />
          {selectedTour && (
            <div className="mb-6 -mt-4 flex justify-center sm:mb-0">
              <TournamentSwitcher
                tournaments={standingsGroups.map((g) => g.tournament)}
                selectedTournamentId={selectedTour._id}
                onSelect={setSelectedTourId}
                className="sm:absolute sm:-top-5 sm:left-5 sm:z-[3]"
              />
            </div>
          )}
          <RibbonBanner label={`WEEK ${weekNo} · FIELD DAY`} />
          <h1 className="va-hero-greeting">
            Welcome to the field, {data.userName} 🎽
          </h1>
          <p className="va-hero-sub">
            Here&apos;s how today&apos;s shaping up.
          </p>

          <div className="va-stat-strip">
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

          {/* Submit CTA overlapping the hero's bottom-right corner */}
          {selectedTour && isSelectedActive && selectedUserTeam && (
            <LogActivityFab
              teamName={selectedUserTeam.team.name}
              tournamentName={selectedTour.name}
              className="sm:absolute sm:right-5 sm:bottom-[-38px] sm:z-[3]"
            />
          )}
        </section>

        {/* ── 2a. COMBINED STANDINGS + RACE (3 design variants) ── */}
        {selectedGroup && (
          <>
            <RibbonBanner label="Standings" />
            <section
              className="va-section va-section--fadein"
              style={{ animationDelay: "120ms" }}
            >
              <StandingsRaceCard
                group={selectedGroup}
                isActive={isSelectedActive}
                chartData={chartData}
                userTeamId={selectedUserTeam?.team._id}
              />
            </section>
          </>
        )}

        {/* ── 3. SQUADS / RIVALS slot ── */}
        {renderSquadsSection ? (
          renderSquadsSection({
            data,
            selectedTournamentTeams: selectedGroup?.teams ?? [],
            selectedUserTeam,
            selectedTournamentName: selectedTour?.name ?? null,
            isSelectedActive,
            activities: data.activities,
          })
        ) : data.teams.length > 0 ? (
          <section className="va-section">
            <RibbonBanner label="MY SQUADS" small />
            <div className="va-squads-grid">
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
                  <TeamCard
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
        ) : null}

        {/* ── 5. TALE OF THE TAPE + SQUAD OF THE DAY ── */}
        <div className="va-grid va-grid--6-6">
          {selectedUserTeam && selectedRival && (
            <section className="va-section va-grid-cell">
              <RibbonBanner label="TALE OF THE TAPE" small />
              <div className="va-rival-wrap">
                <RosetteTile team={selectedUserTeam} label="YOU" highlight />
                <div className="va-rival-vs">
                  <svg aria-hidden width="56" height="56" viewBox="0 0 56 56">
                    <path
                      d="M4 4 L52 4 L52 52 L4 52 Z"
                      fill="var(--fd-gold)"
                      stroke="var(--fd-ink)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      transform="rotate(45 28 28) scale(0.68) translate(8 8)"
                    />
                  </svg>
                  <span className="va-rival-vs-label">VS</span>
                  <div
                    className={`va-rival-delta ${selectedRivalDelta >= 0 ? "va-rival-delta--ahead" : "va-rival-delta--behind"}`}
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

          <section className="va-section va-grid-cell">
            <RibbonBanner label="SQUAD OF THE DAY" small />
            {mvpTeam ? (
              <div className="va-mvp-card">
                <div className="va-mvp-trophy" aria-hidden>
                  <TrophySvg />
                </div>
                <div className="va-mvp-body">
                  <div className="va-mvp-ribbon">Star Crew</div>
                  <div className="va-mvp-name">{mvpTeam.team.name}</div>
                  <p className="va-mvp-detail">
                    {mvpDisplayCount} submission
                    {mvpDisplayCount === 1 ? "" : "s"}{" "}
                    {mvpCountToday > 0 ? "today" : "this period"} ·{" "}
                    <strong>{mvpTeam.tournament.name}</strong>
                  </p>
                  <p className="va-mvp-detail">
                    {mvpTeam.memberCount} member
                    {mvpTeam.memberCount === 1 ? "" : "s"}
                    {mvpTeam.userRole === "captain" && (
                      <span className="va-captain-badge">
                        <WhistleSvgSmall />
                        Captain
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="va-mvp-card">
                <div className="va-mvp-trophy" aria-hidden>
                  <TrophySvg />
                </div>
                <div className="va-mvp-body">
                  <div className="va-mvp-ribbon">Star Crew</div>
                  <div className="va-mvp-name">No teams yet</div>
                  <p className="va-mvp-detail">Join a tournament to compete.</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── 6. FIELD STATS + HIGHLIGHTS ── */}
        <div className="va-grid va-grid--6-6">
          <section
            className="va-section va-grid-cell va-section--fadein"
            style={{ animationDelay: "100ms" }}
          >
            <RibbonBanner label="FIELD STATS" small />
            <div className="va-metrics-grid va-metrics-grid--2x2">
              <MetricTile
                label="STREAK"
                value={streakDays}
                unit="DAYS"
                color="var(--fd-sky)"
                sparkline={last7
                  .slice()
                  .reverse()
                  .map((d) => (activeDaySet.has(d) ? 1 : 0))}
              />
              <MetricTile
                label="THIS WEEK"
                value={weekApproved}
                unit="APPROVED"
                color="var(--fd-grass)"
                sparkline={sparkline}
              />
              <MetricTile
                label="TODAY"
                value={todayApproved}
                unit="LOGGED"
                color="var(--fd-sunset)"
                sparkline={sparkline}
              />
              <MetricTile
                label="SQUAD RANK"
                value={squadRank}
                unit={`OF ${Math.max(standings.length, 1)}`}
                color="var(--fd-plum)"
                sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
              />
            </div>
          </section>

          {data.activities.length > 0 && (
            <section className="va-section va-grid-cell">
              <RibbonBanner label="HIGHLIGHTS FROM THE FIELD" small />
              <div className="va-timeline">
                {data.activities.map((a, i) => {
                  const dotClass = activityDotClass(a.type);
                  return (
                    <div key={i} className="va-timeline-row">
                      <div
                        className={`va-timeline-dot ${dotClass}`}
                        aria-hidden
                      />
                      <div className="va-timeline-time">
                        {formatRelative(a.timestamp)}
                      </div>
                      <div className="va-timeline-desc">{a.description}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── 7. INBOX (invitations, requests, pending, deadlines) ── */}
        {hasInbox && (
          <section className="va-section">
            <RibbonBanner label="INBOX" small />
            <div className="va-queue-grid va-queue-grid--stacked">
              {/* Left: invitations + join requests */}
              <div className="va-queue-col">
                {data.invitations.map((inv) => (
                  <div key={inv.id} className="va-rsvp-card">
                    <div className="va-rsvp-tag">RSVP</div>
                    <div className="va-rsvp-team">{inv.teamName}</div>
                    <div className="va-rsvp-meta">
                      {inv.tournamentName} · invited by {inv.invitedBy}
                    </div>
                    <div className="va-rsvp-time">
                      {formatRelative(inv.timestamp)}
                    </div>
                    <div className="va-rsvp-actions">
                      <button className="va-btn va-btn--yes">
                        COUNT ME IN
                      </button>
                      <button className="va-btn va-btn--maybe">
                        MAYBE NEXT TIME
                      </button>
                    </div>
                  </div>
                ))}
                {data.joinRequests.map((jr) => (
                  <div
                    key={jr.id}
                    className="va-rsvp-card va-rsvp-card--request"
                  >
                    <div className="va-rsvp-tag va-rsvp-tag--plum">
                      JOIN REQUEST
                    </div>
                    <div className="va-rsvp-team">{jr.userName}</div>
                    <div className="va-rsvp-meta">
                      wants to join {jr.teamName}
                    </div>
                    <div className="va-rsvp-time">
                      {formatRelative(jr.timestamp)}
                    </div>
                    <div className="va-rsvp-actions">
                      <button className="va-btn va-btn--yes">
                        WELCOME ABOARD
                      </button>
                      <button className="va-btn va-btn--maybe">
                        NOT TODAY
                      </button>
                    </div>
                  </div>
                ))}
                {data.invitations.length === 0 &&
                  data.joinRequests.length === 0 && (
                    <div className="va-queue-empty">
                      No pending RSVPs — you&apos;re all caught up.
                    </div>
                  )}
              </div>

              {/* Right: pending submissions + deadlines */}
              <div className="va-queue-col">
                {data.pendingSubmissions.map((s) => {
                  const subDate = new Date(s.date);
                  const daysAgo = Math.round(
                    (Date.now() - subDate.getTime()) / 86_400_000,
                  );
                  return (
                    <div key={s.id} className="va-pending-card">
                      <WhistleSvg />
                      <div className="va-pending-body">
                        <div className="va-pending-team">{s.teamName}</div>
                        <div className="va-pending-tour">
                          {s.tournamentName}
                        </div>
                        <div className="va-pending-note">
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
                    className="va-deadline-card va-deadline-card--urgent"
                  >
                    <StopwatchSvg urgent />
                    <div className="va-deadline-body">
                      <div className="va-deadline-name">
                        {d.tournament.name}
                      </div>
                      <div className="va-deadline-note va-deadline-note--urgent">
                        Final whistle in {d.daysUntilEnd} day
                        {d.daysUntilEnd === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                ))}
                {data.pendingSubmissions.length === 0 &&
                  urgentDeadlines.length === 0 && (
                    <div className="va-queue-empty">
                      Queue is clear — nothing pending.
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* ── 8. COACH'S NOTES (admin only) ── */}
        {data.isAdmin && data.adminStats && (
          <section className="va-section">
            <RibbonBanner label="COACH'S CLIPBOARD" small />
            <div className="va-coach-card">
              <div className="va-coach-grid">
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

        {/* ── 9. FOOTER RIBBON ── */}
        <footer className="va-footer">
          <FooterRibbon date={dateLabel} />
        </footer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractName(description: string): string {
  const match = description.match(/^([A-Z][a-z]+)/);
  return match ? match[1] : "Your teammate";
}

function activityDotClass(type: string): string {
  if (type === "submission_approved") return "va-dot--grass";
  if (type === "team_member_joined") return "va-dot--sky";
  if (type.includes("join_request")) return "va-dot--plum";
  if (type === "submission_rejected") return "va-dot--sunset";
  return "va-dot--mute";
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

export function RibbonBanner({
  label,
  small,
}: {
  label: string;
  small?: boolean;
}) {
  return (
    <div className={`va-ribbon${small ? " va-ribbon--small" : ""}`}>
      {/* Left notch */}
      <svg
        aria-hidden
        className="va-ribbon-tail va-ribbon-tail--left"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <div className="va-ribbon-label">{label}</div>
      {/* Right notch */}
      <svg
        aria-hidden
        className="va-ribbon-tail va-ribbon-tail--right"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="0,0 0,40 18,20" fill="currentColor" />
      </svg>
    </div>
  );
}

function Confetti() {
  // Fixed positions — no runtime randomness
  const dots = [
    { cls: "va-confetti-1", color: "va-c-grass" },
    { cls: "va-confetti-2", color: "va-c-sunset" },
    { cls: "va-confetti-3", color: "va-c-sky" },
    { cls: "va-confetti-4", color: "va-c-plum" },
    { cls: "va-confetti-5", color: "va-c-gold" },
    { cls: "va-confetti-6", color: "va-c-grass" },
    { cls: "va-confetti-7", color: "va-c-sunset" },
    { cls: "va-confetti-8", color: "va-c-sky" },
    { cls: "va-confetti-9", color: "va-c-plum" },
    { cls: "va-confetti-10", color: "va-c-gold" },
    { cls: "va-confetti-11", color: "va-c-grass" },
    { cls: "va-confetti-12", color: "va-c-sky" },
    { cls: "va-confetti-13", color: "va-c-sunset" },
    { cls: "va-confetti-14", color: "va-c-plum" },
    { cls: "va-confetti-15", color: "va-c-gold" },
  ];
  return (
    <>
      {dots.map((d) => (
        <span
          key={d.cls}
          className={`va-confetti ${d.cls} ${d.color}`}
          aria-hidden
        />
      ))}
    </>
  );
}

function StatChip({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  suffix?: string;
}) {
  return (
    <div className={`va-stat-chip${accent ? " va-stat-chip--accent" : ""}`}>
      <span className="va-stat-num">
        {value}
        {suffix ? <span className="va-stat-suffix">{suffix}</span> : null}
      </span>
      <span className="va-stat-label">{label}</span>
    </div>
  );
}

function Podium({
  teams,
}: {
  teams: Array<{ team: { name: string; points: number }; userRole: string }>;
}) {
  // Arrange podium: 2nd (left), 1st (center), 3rd (right)
  const order = [teams[1] ?? null, teams[0] ?? null, teams[2] ?? null];
  const heights = [120, 160, 90]; // px heights of the podium blocks
  const medals: Array<"gold" | "silver" | "bronze"> = [
    "silver",
    "gold",
    "bronze",
  ];
  const positions = ["2nd", "1st", "3rd"];

  return (
    <div className="va-podium">
      {order.map((team, i) =>
        team ? (
          <div key={team.team.name} className="va-podium-slot">
            <MedalSvg type={medals[i]} />
            <div className="va-podium-name">{team.team.name}</div>
            <div className="va-podium-pts">{team.team.points}</div>
            <div
              className={`va-podium-block va-podium-block--${medals[i]}`}
              style={{ height: `${heights[i]}px` }}
            >
              <span className="va-podium-pos">{positions[i]}</span>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}

function TeamCard({
  name,
  tournamentName,
  points,
  memberCount,
  isCaptain,
  progress,
}: {
  name: string;
  tournamentName: string;
  points: number;
  memberCount: number;
  isCaptain: boolean;
  progress: number;
}) {
  const avatarColors = [
    "va-av-grass",
    "va-av-sky",
    "va-av-sunset",
    "va-av-plum",
    "va-av-gold",
  ];
  const displayCount = Math.min(memberCount, 5);

  return (
    <div className="va-team-card">
      <div className="va-team-head">
        <div className="va-team-name">
          {name}
          {isCaptain && (
            <span className="va-captain-badge">
              <WhistleSvgSmall />
              Team Captain
            </span>
          )}
        </div>
        <div className="va-team-pts">{points}</div>
      </div>
      <div className="va-team-tour">{tournamentName}</div>
      <div className="va-team-members">
        {Array.from({ length: displayCount }).map((_, idx) => (
          <span
            key={idx}
            className={`va-avatar ${avatarColors[idx % avatarColors.length]}`}
          />
        ))}
        {memberCount > 5 && (
          <span className="va-avatar-more">+{memberCount - 5}</span>
        )}
      </div>
      <div className="va-progress-track">
        <div
          className="va-progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <RunnerSvg progress={Math.min(progress, 100)} />
      </div>
      <div className="va-progress-labels">
        <span>Start</span>
        <span>Finish</span>
      </div>
    </div>
  );
}

function CoachStat({
  label,
  value,
  sub,
  ok,
  unit,
}: {
  label: string;
  value: number;
  sub: string;
  ok?: boolean;
  unit?: string;
}) {
  return (
    <div className="va-coach-stat">
      <CheckboxSvg checked={ok} />
      <div className="va-coach-stat-body">
        <div className="va-coach-stat-label">{label}</div>
        <div className="va-coach-stat-value">
          {value}
          {unit && <span className="va-coach-stat-unit">{unit}</span>}
        </div>
        <div className="va-coach-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

function FooterRibbon({ date }: { date: string }) {
  return (
    <div className="va-footer-ribbon">
      <svg
        aria-hidden
        className="va-footer-tail va-footer-tail--left"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <span className="va-footer-label">
        GO TEAM &middot; {date} &middot; KEEP IT MOVING
      </span>
      <svg
        aria-hidden
        className="va-footer-tail va-footer-tail--right"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="0,0 0,40 18,20" fill="currentColor" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons (stroke-based, friendly)
// ---------------------------------------------------------------------------

function MedalSvg({ type }: { type: "gold" | "silver" | "bronze" }) {
  const colors: Record<string, string> = {
    gold: "#ffc847",
    silver: "#c5cdd6",
    bronze: "#cd9352",
  };
  const c = colors[type];
  return (
    <svg
      aria-hidden
      width="44"
      height="54"
      viewBox="0 0 44 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="va-medal-svg"
    >
      {/* Ribbon straps */}
      <line
        x1="16"
        y1="2"
        x2="12"
        y2="18"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="2"
        x2="32"
        y2="18"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Medal circle */}
      <circle
        cx="22"
        cy="34"
        r="16"
        fill={c}
        stroke="var(--fd-ink)"
        strokeWidth="2"
      />
      <circle
        cx="22"
        cy="34"
        r="11"
        fill="none"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        opacity="0.3"
      />
    </svg>
  );
}

function TrophySvg() {
  return (
    <svg
      aria-hidden
      width="64"
      height="72"
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cup body */}
      <path
        d="M16 8 H48 V36 C48 48 16 48 16 36 Z"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        fill="rgba(255,200,71,0.25)"
        strokeLinejoin="round"
      />
      {/* Handles */}
      <path
        d="M16 16 C8 16 8 28 16 28"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 16 C56 16 56 28 48 28"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Stem */}
      <line
        x1="32"
        y1="48"
        x2="32"
        y2="60"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Base */}
      <rect
        x="20"
        y="60"
        width="24"
        height="5"
        rx="2"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        fill="rgba(255,200,71,0.3)"
      />
      {/* Star inside */}
      <path
        d="M32 18 L33.5 23 L38.5 23 L34.5 26 L36 31 L32 28 L28 31 L29.5 26 L25.5 23 L30.5 23 Z"
        fill="#ffc847"
        stroke="var(--fd-ink)"
        strokeWidth="1"
      />
    </svg>
  );
}

function WhistleSvg() {
  return (
    <svg
      aria-hidden
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="va-whistle-svg"
    >
      <circle
        cx="9"
        cy="14"
        r="5"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        fill="rgba(255,122,69,0.15)"
      />
      <path
        d="M14 14 L20 8"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 6 L22 6"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="9"
        x2="9"
        y2="11"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WhistleSvgSmall() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }}
    >
      <circle
        cx="9"
        cy="14"
        r="5"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M14 14 L20 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M17 6 L22 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopwatchSvg({ urgent }: { urgent: boolean }) {
  const stroke = urgent ? "#e53e3e" : "var(--fd-ink)";
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="va-stopwatch-svg"
    >
      <circle
        cx="12"
        cy="14"
        r="8"
        stroke={stroke}
        strokeWidth="2"
        fill="rgba(93,185,245,0.1)"
      />
      <line
        x1="12"
        y1="14"
        x2="12"
        y2="9"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="14"
        x2="15"
        y2="12"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 3 L15 3"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="6"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RunnerSvg({ progress }: { progress: number }) {
  return (
    <svg
      aria-hidden
      width="18"
      height="24"
      viewBox="0 0 18 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="va-runner"
      style={{ left: `calc(${progress}% - 9px)` }}
    >
      {/* Head */}
      <circle
        cx="9"
        cy="4"
        r="3"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        fill="rgba(93,199,122,0.4)"
      />
      {/* Body */}
      <path
        d="M9 7 L9 16"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Arms */}
      <path
        d="M9 10 L5 13"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 10 L13 8"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Legs */}
      <path
        d="M9 16 L6 22"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16 L13 20"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckboxSvg({ checked }: { checked?: boolean }) {
  return (
    <svg
      aria-hidden
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="va-checkbox-svg"
    >
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="4"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        fill={checked ? "rgba(93,199,122,0.3)" : "rgba(122,106,92,0.1)"}
      />
      {checked && (
        <path
          d="M5 11 L9 15 L17 7"
          stroke="#5dc77a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function StarSvgSmall() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{
        display: "inline",
        verticalAlign: "middle",
        marginRight: "4px",
        flexShrink: 0,
      }}
    >
      <path
        d="M7 1 L8.5 5 L13 5 L9.5 7.5 L11 12 L7 9.5 L3 12 L4.5 7.5 L1 5 L5.5 5 Z"
        fill="var(--fd-gold)"
        stroke="var(--fd-ink)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MedallionSvg({ number }: { number: number }) {
  return (
    <svg
      aria-hidden
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="var(--fd-paper-deep)"
        stroke="var(--fd-ink)"
        strokeWidth="2"
      />
      <circle
        cx="16"
        cy="16"
        r="10"
        fill="none"
        stroke="var(--fd-ink)"
        strokeWidth="1"
        opacity="0.2"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="'DM Mono', monospace"
        fontSize="11"
        fontWeight="500"
        fill="var(--fd-ink)"
      >
        {String(number).padStart(2, "0")}
      </text>
    </svg>
  );
}

function RosetteTile({
  team,
  label,
  highlight,
}: {
  team: {
    team: { name: string; points: number };
    tournament: { name: string; startDate: string; endDate: string };
    memberCount: number;
    userRole: string;
  };
  label: string;
  highlight?: boolean;
}) {
  const now = Date.now();
  const start = new Date(team.tournament.startDate).getTime();
  const end = new Date(team.tournament.endDate).getTime();
  const progress = Math.round(
    (Math.min(Math.max(now - start, 0), end - start) /
      Math.max(end - start, 1)) *
      100,
  );
  return (
    <div
      className={`va-rosette-card ${highlight ? "va-rosette-card--highlight" : ""}`}
    >
      <div className="va-rosette-label">{label}</div>
      <div className="va-rosette-name">{team.team.name}</div>
      {team.userRole === "captain" && (
        <span className="va-captain-badge" style={{ marginBottom: "0.5rem" }}>
          <WhistleSvgSmall />
          Captain
        </span>
      )}
      <div className="va-rosette-pts">
        {team.team.points} <span className="va-rosette-pts-unit">pts</span>
      </div>
      <div className="va-rosette-meta">{team.memberCount} members</div>
      <div className="va-progress-track" style={{ marginTop: "0.75rem" }}>
        <div className="va-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="va-progress-labels">
        <span>Start</span>
        <span>{progress}%</span>
        <span>End</span>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  unit,
  color,
  sparkline,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  sparkline: number[];
}) {
  const w = 60;
  const h = 20;
  const max = Math.max(...sparkline, 1);
  const pts = sparkline
    .map((v, i) => {
      const x = (i / Math.max(sparkline.length - 1, 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div
      className="va-metric-tile"
      style={{ "--fd-metric-accent": color } as React.CSSProperties}
    >
      <div className="va-metric-accent-rule" aria-hidden />
      <span className="va-metric-label">{label}</span>
      <span className="va-metric-value">{value}</span>
      <span className="va-metric-unit">{unit}</span>
      <svg
        aria-hidden
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="va-metric-sparkline"
      >
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function VariantAStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Funnel+Display:wght@700;800&family=Lexend:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

/* ── Layout root (tokens live at :root / .dark in globals.css) ───── */
.variant-a {
  position: relative;
  overflow: hidden;
  font-family: 'Lexend', sans-serif;
  background: var(--fd-paper);
  color: var(--fd-ink);
  padding: 1.5rem 1.5rem 2.5rem;
  min-height: 100vh;
}
.variant-a > * { position: relative; z-index: 1; }
.dark .variant-a {
  --fd-dot: rgba(244, 236, 226, 0.08);
}

/* ── Dot-grid notebook background (borrowed from variant H) ────────── */
.va-dotgrid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(circle, var(--fd-dot, rgba(var(--fd-ink-rgb), 0.10)) 1px, transparent 1.4px);
  background-size: 18px 18px;
  background-position: 0 0;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.9) 80%, rgba(0,0,0,0.3));
}

/* ── Grid scaffolding for paired rows ──────────────────────────────── */
.va-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 1.25rem;
  position: relative;
  z-index: 1;
}
@media (min-width: 960px) {
  .va-grid--7-5 { grid-template-columns: 7fr 5fr; }
  .va-grid--6-6 { grid-template-columns: 1fr 1fr; }
  .va-grid--5-7 { grid-template-columns: 5fr 7fr; }
}
.va-grid-cell { margin-top: 0; display: flex; flex-direction: column; }
.va-grid-cell > .va-podium-wrap,
.va-grid-cell > .va-mvp-card,
.va-grid-cell > .va-rival-wrap,
.va-grid-cell > .va-timeline,
.va-grid-cell > .va-squads-grid,
.va-grid-cell > .va-queue-grid,
.va-grid-cell > .va-lineup-wrap,
.va-grid-cell > .va-metrics-grid { flex: 1; }

/* ── Confetti dots ─────────────────────────────────────────────────── */
.va-confetti {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.va-c-grass  { background: var(--fd-grass); }
.va-c-sunset { background: var(--fd-sunset); }
.va-c-sky    { background: var(--fd-sky); }
.va-c-plum   { background: var(--fd-plum); }
.va-c-gold   { background: var(--fd-gold); }

.va-confetti-1  { top: 4%;  left: 8%;  width: 10px; height: 10px; opacity: 0.55; }
.va-confetti-2  { top: 7%;  left: 22%; width: 7px;  height: 7px;  opacity: 0.4;  }
.va-confetti-3  { top: 3%;  left: 45%; width: 12px; height: 12px; opacity: 0.5;  }
.va-confetti-4  { top: 9%;  left: 63%; width: 8px;  height: 8px;  opacity: 0.45; }
.va-confetti-5  { top: 5%;  left: 78%; width: 10px; height: 10px; opacity: 0.5;  }
.va-confetti-6  { top: 2%;  left: 91%; width: 7px;  height: 7px;  opacity: 0.4;  }
.va-confetti-7  { top: 12%; left: 5%;  width: 6px;  height: 6px;  opacity: 0.35; }
.va-confetti-8  { top: 11%; left: 35%; width: 9px;  height: 9px;  opacity: 0.4;  }
.va-confetti-9  { top: 13%; left: 55%; width: 7px;  height: 7px;  opacity: 0.45; }
.va-confetti-10 { top: 10%; left: 72%; width: 11px; height: 11px; opacity: 0.5;  }
.va-confetti-11 { top: 15%; left: 88%; width: 8px;  height: 8px;  opacity: 0.4;  }
.va-confetti-12 { top: 18%; left: 15%; width: 6px;  height: 6px;  opacity: 0.3;  }
.va-confetti-13 { top: 17%; left: 50%; width: 9px;  height: 9px;  opacity: 0.35; }
.va-confetti-14 { top: 20%; left: 82%; width: 7px;  height: 7px;  opacity: 0.3;  }
.va-confetti-15 { top: 1%;  left: 58%; width: 6px;  height: 6px;  opacity: 0.35; }

/* ── Layout scaffolding ───────────────────────────────────────────── */
.va-section { margin-top: 1.25rem; position: relative; z-index: 1; }

/* ── Ribbon banner ─────────────────────────────────────────────────── */
.va-ribbon {
  display: flex;
  align-items: stretch;
  width: fit-content;
  margin: 0 auto 1.5rem;
  color: #2a1f1a;
  background: var(--fd-gold);
  min-height: 3rem;
  position: relative;
}
.va-ribbon--small {
  min-height: 2.25rem;
  margin-bottom: 1.25rem;
}
.va-ribbon-tail {
  display: block;
  color: var(--fd-gold);
  flex-shrink: 0;
  height: 3rem;
}
.va-ribbon--small .va-ribbon-tail { height: 2.25rem; }
.va-ribbon-tail--left  { margin-left: -1px; }
.va-ribbon-tail--right { margin-right: -1px; }
.va-ribbon-label {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.va-ribbon--small .va-ribbon-label { font-size: 0.8rem; }

/* ── Hero ──────────────────────────────────────────────────────────── */
.va-hero {
  position: relative;
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 2.25rem 2rem 2rem;
  margin-inline: 1rem;
  text-align: center;
}
@media (min-width: 768px) {
  .va-hero { margin-inline: 2rem; }
}
.va-hero-greeting {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: clamp(1.75rem, 4vw, 2.8rem);
  line-height: 1.1;
  margin: 1rem 0 0.45rem;
  color: var(--fd-ink);
}
.va-hero-sub {
  font-family: 'Lexend', sans-serif;
  font-weight: 400;
  font-size: 1.05rem;
  color: var(--fd-mute);
  margin: 0 0 1.75rem;
}

/* ── Stat strip ────────────────────────────────────────────────────── */
.va-stat-strip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}
@media (min-width: 640px) {
  .va-stat-strip { grid-template-columns: repeat(4, 1fr); }
}
.va-stat-chip {
  background: var(--fd-paper-deep);
  border: 2px solid var(--fd-ink);
  border-radius: 14px;
  box-shadow: 4px 4px 0 var(--fd-shadow);
  padding: 1rem 0.75rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.va-stat-chip--accent { background: rgba(255,122,69,0.12); border-color: var(--fd-sunset); }
.va-stat-num {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 2.2rem;
  line-height: 1;
  color: var(--fd-ink);
  font-variant-aumeric: tabular-nums;
}
.va-stat-label {
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fd-mute);
}

/* ── Hero stat chip suffix ─────────────────────────────────────────── */
.va-stat-suffix {
  font-family: 'DM Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--fd-mute);
  margin-left: 0.2rem;
  letter-spacing: 0.04em;
}

/* ── Submit CTA hero spacing (FAB itself styled via Tailwind) ─────── */
.va-hero { padding-bottom: 2rem; }
@media (min-width: 640px) {
  .va-hero { padding-bottom: 4.5rem; margin-bottom: 1.25rem; }
}

/* ── Tournament standings card ─────────────────────────────────────── */
.va-tour-standings {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.va-tour-card {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 18px;
  box-shadow: 5px 5px 0 var(--fd-shadow);
  padding: 1rem 1.25rem 1.25rem;
}
.va-tour-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  gap: 0.75rem;
}
.va-tour-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.va-tour-pill {
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border: 2px solid var(--fd-ink);
  border-radius: 999px;
}
.va-tour-pill--active { background: var(--fd-grass); color: var(--fd-ink); }
.va-tour-pill--ended { background: var(--fd-paper-deep); color: var(--fd-mute); }
.va-tr--mine { background: rgba(255,200,71,0.12); }

/* ── Podium ────────────────────────────────────────────────────────── */
.va-podium-wrap {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 2rem 1.5rem 0;
  overflow: hidden;
}
.va-podium-wrap--embedded {
  border: none;
  border-radius: 0;
  box-shadow: none;
  padding: 0.5rem 0 0.75rem;
  background: transparent;
}
.va-podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
}
.va-podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 200px;
}
.va-medal-svg { margin-bottom: 0.35rem; }
.va-podium-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.2rem;
  padding: 0 0.3rem;
  line-height: 1.2;
}
.va-podium-pts {
  font-family: 'DM Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--fd-mute);
  margin-bottom: 0.5rem;
  font-variant-aumeric: tabular-nums;
}
.va-podium-block {
  width: 100%;
  border-radius: 8px 8px 0 0;
  border: 2px solid var(--fd-ink);
  border-bottom: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.6rem;
}
.va-podium-block--gold   { background: rgba(255,200,71,0.35); }
.va-podium-block--silver { background: rgba(197,205,214,0.4); }
.va-podium-block--bronze { background: rgba(205,147,82,0.3); }
.va-podium-pos {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--fd-ink);
  opacity: 0.7;
}

/* ── MVP card ──────────────────────────────────────────────────────── */
.va-mvp-card {
  background: var(--fd-grass);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 2rem 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
}
.va-mvp-trophy {
  flex-shrink: 0;
}
.va-mvp-body { flex: 1; }
.va-mvp-ribbon {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fd-ink);
  opacity: 0.75;
  margin-bottom: 0.4rem;
}
.va-mvp-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  color: var(--fd-ink);
  line-height: 1.1;
  margin-bottom: 0.45rem;
}
.va-mvp-detail {
  font-family: 'Lexend', sans-serif;
  font-size: 0.95rem;
  color: var(--fd-ink);
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}
.va-mvp-detail strong { font-weight: 600; }

/* ── Team cards ────────────────────────────────────────────────────── */
.va-squads-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
/* Inside a narrow grid cell we want a single column so cards breathe */
.va-grid-cell .va-squads-grid { grid-template-columns: 1fr !important; }
.va-team-card {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 1.5rem;
}
.va-team-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}
.va-team-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1.15rem;
  line-height: 1.2;
  flex: 1;
}
.va-captain-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'Lexend', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255,200,71,0.3);
  border: 1.5px solid var(--fd-gold);
  border-radius: 100px;
  padding: 0.15rem 0.5rem;
  color: var(--fd-ink);
  margin-top: 0.35rem;
  margin-left: 0.35rem;
}
.va-team-pts {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 1.6rem;
  color: var(--fd-ink);
  font-variant-aumeric: tabular-nums;
  line-height: 1;
  flex-shrink: 0;
}
.va-team-tour {
  font-family: 'Lexend', sans-serif;
  font-style: italic;
  font-size: 0.82rem;
  color: var(--fd-mute);
  margin-bottom: 0.85rem;
}
.va-team-members {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.va-avatar {
  display: inline-block;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--fd-card);
  box-shadow: 0 0 0 1.5px var(--fd-ink);
}
.va-av-grass  { background: var(--fd-grass); }
.va-av-sky    { background: var(--fd-sky); }
.va-av-sunset { background: var(--fd-sunset); }
.va-av-plum   { background: var(--fd-plum); }
.va-av-gold   { background: var(--fd-gold); }
.va-avatar-more {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: var(--fd-mute);
  margin-left: 0.25rem;
}

/* ── Progress track ────────────────────────────────────────────────── */
.va-progress-track {
  position: relative;
  height: 10px;
  background: var(--fd-paper-deep);
  border: 1.5px solid var(--fd-ink);
  border-radius: 100px;
  overflow: visible;
  margin-bottom: 0.3rem;
}
.va-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--fd-grass);
  border-radius: 100px;
  transition: width 0.4s ease;
}
.va-runner {
  position: absolute;
  top: -8px;
  pointer-events: none;
}
.va-progress-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  color: var(--fd-mute);
  letter-spacing: 0.08em;
}

/* ── Queue grid ────────────────────────────────────────────────────── */
.va-queue-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .va-queue-grid { grid-template-columns: 1fr 1fr; }
}
/* When queue sits inside a half-width row alongside My Squads, stack */
.va-queue-grid--stacked { grid-template-columns: 1fr !important; }
.va-queue-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.va-queue-empty {
  font-family: 'Lexend', sans-serif;
  font-size: 0.85rem;
  color: var(--fd-mute);
  padding: 1.25rem;
  border: 2px dashed var(--fd-mute);
  border-radius: 14px;
  text-align: center;
  opacity: 0.7;
}

/* ── RSVP cards ────────────────────────────────────────────────────── */
.va-rsvp-card {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 16px;
  box-shadow: 4px 4px 0 var(--fd-shadow);
  padding: 1.1rem 1.25rem;
}
.va-rsvp-tag {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: rgba(255,200,71,0.35);
  border: 1.5px solid var(--fd-gold);
  border-radius: 100px;
  padding: 0.15rem 0.6rem;
  margin-bottom: 0.5rem;
}
.va-rsvp-tag--plum {
  background: rgba(161,102,212,0.15);
  border-color: var(--fd-plum);
}
.va-rsvp-team {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
}
.va-rsvp-meta {
  font-family: 'Lexend', sans-serif;
  font-size: 0.82rem;
  color: var(--fd-mute);
  margin-bottom: 0.2rem;
}
.va-rsvp-time {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: var(--fd-mute);
  margin-bottom: 0.75rem;
}
.va-rsvp-actions { display: flex; gap: 0.5rem; }
.va-btn {
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  border: 2px solid var(--fd-ink);
  border-radius: 100px;
  padding: 0.35rem 1rem;
  cursor: pointer;
  transition: box-shadow 80ms ease, transform 80ms ease;
}
.va-btn:hover { box-shadow: 3px 3px 0 var(--fd-ink); transform: translate(-1px,-1px); }
.va-btn--yes   { background: var(--fd-sunset); color: #ffffff; }
.va-btn--maybe { background: var(--fd-paper-deep); color: var(--fd-ink); }

/* ── Pending + deadline cards ──────────────────────────────────────── */
.va-pending-card,
.va-deadline-card {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 16px;
  box-shadow: 4px 4px 0 var(--fd-shadow);
  padding: 1rem 1.25rem;
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}
.va-deadline-card--urgent {
  border-color: #e53e3e;
  background: rgba(229,62,62,0.05);
}
.va-whistle-svg, .va-stopwatch-svg { flex-shrink: 0; margin-top: 2px; }
.va-pending-body, .va-deadline-body { flex: 1; }
.va-pending-team, .va-deadline-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.15rem;
}
.va-pending-tour {
  font-family: 'Lexend', sans-serif;
  font-size: 0.8rem;
  color: var(--fd-mute);
  margin-bottom: 0.2rem;
}
.va-pending-note, .va-deadline-note {
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: var(--fd-mute);
}
.va-deadline-note--urgent {
  color: #e53e3e;
  font-weight: 500;
}

/* ── Activity timeline ─────────────────────────────────────────────── */
.va-timeline {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  position: relative;
}
.va-timeline::before {
  content: '';
  position: absolute;
  top: 1.5rem;
  bottom: 1.5rem;
  left: 1.85rem;
  width: 0;
  border-left: 2px dashed rgba(var(--fd-ink-rgb), 0.2);
}
.va-timeline-row {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: 0 0.75rem;
  padding: 0.6rem 0;
  position: relative;
}
.va-timeline-dot {
  position: absolute;
  left: -1.65rem;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--fd-card);
  box-shadow: 0 0 0 2px var(--fd-ink);
}
.va-dot--grass  { background: var(--fd-grass); }
.va-dot--sky    { background: var(--fd-sky); }
.va-dot--plum   { background: var(--fd-plum); }
.va-dot--sunset { background: var(--fd-sunset); }
.va-dot--mute   { background: var(--fd-mute); }
.va-timeline-time {
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  color: var(--fd-mute);
  padding-top: 0.1rem;
  white-space: nowrap;
}
.va-timeline-desc {
  font-family: 'Lexend', sans-serif;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--fd-ink);
}

/* ── Coach clipboard ───────────────────────────────────────────────── */
.va-coach-card {
  background: var(--fd-paper-deep);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 1.75rem;
}
.va-coach-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .va-coach-grid { grid-template-columns: repeat(4, 1fr); }
}
.va-coach-stat {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 14px;
  box-shadow: 3px 3px 0 var(--fd-shadow);
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.va-checkbox-svg { flex-shrink: 0; margin-top: 1px; }
.va-coach-stat-body { flex: 1; }
.va-coach-stat-label {
  font-family: 'Lexend', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--fd-mute);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.2rem;
}
.va-coach-stat-value {
  font-family: 'DM Mono', monospace;
  font-size: 1.8rem;
  font-weight: 500;
  line-height: 1;
  font-variant-aumeric: tabular-nums;
  margin-bottom: 0.2rem;
}
.va-coach-stat-unit { font-size: 1rem; margin-left: 0.05em; }
.va-coach-stat-sub {
  font-family: 'Lexend', sans-serif;
  font-size: 0.72rem;
  color: var(--fd-mute);
}

/* ── Keyframe animations ───────────────────────────────────────────── */
@keyframes va-fadein-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes va-bar-grow {
  from { width: 0 !important; }
  to   { /* final width set inline */ }
}
@keyframes va-ribbon-flutter {
  0%, 100% { letter-spacing: 0.14em; }
  50%       { letter-spacing: 0.18em; }
}
@keyframes va-confetti-drift {
  0%   { transform: translateY(0) rotate(0deg); }
  50%  { transform: translateY(-6px) rotate(10deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

.va-section--fadein {
  animation: va-fadein-up 0.4s ease both;
}
.va-bar-fill--anim {
  animation: va-bar-grow 0.5s ease both;
}
.va-ribbon:hover .va-ribbon-label {
  animation: va-ribbon-flutter 0.4s ease;
}
.va-confetti-1 { animation: va-confetti-drift 4s ease-in-out infinite; }
.va-confetti-2 { animation: va-confetti-drift 5s ease-in-out 0.5s infinite; }
.va-confetti-3 { animation: va-confetti-drift 3.5s ease-in-out 1s infinite; }

@media (prefers-reduced-motion: reduce) {
  .va-section--fadein,
  .va-bar-fill--anim,
  .va-confetti-1,
  .va-confetti-2,
  .va-confetti-3 {
    animation: none;
  }
}

/* hover lift on team + metric cards */
.va-team-card:hover,
.va-metric-tile:hover,
.va-rosette-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--fd-shadow);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

/* ── Metric tiles ──────────────────────────────────────────────────── */
.va-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}
@media (min-width: 640px) {
  .va-metrics-grid { grid-template-columns: repeat(4, 1fr); }
}
/* When the metrics block sits inside a narrow grid cell, force 2×2 */
.va-metrics-grid--2x2 { grid-template-columns: repeat(2, 1fr) !important; }
.va-metric-tile {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 16px;
  box-shadow: 5px 5px 0 var(--fd-shadow);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  overflow: hidden;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.va-metric-accent-rule {
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--fd-metric-accent, var(--fd-gold)) 0px,
    var(--fd-metric-accent, var(--fd-gold)) 8px,
    transparent 8px,
    transparent 14px
  );
  border-radius: 2px;
  margin-bottom: 0.6rem;
  margin-top: -0.25rem;
  margin-left: -1rem;
  margin-right: -1rem;
}
.va-metric-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fd-mute);
}
.va-metric-value {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 2.4rem;
  line-height: 1;
  color: var(--fd-ink);
  font-variant-aumeric: tabular-nums;
}
.va-metric-unit {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fd-mute);
  margin-bottom: 0.4rem;
}
.va-metric-sparkline { margin-top: auto; }

/* ── Rival / Tale of the Tape ──────────────────────────────────────── */
.va-rival-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
}
@media (max-width: 639px) {
  .va-rival-wrap { flex-direction: column; }
}
.va-rosette-card {
  flex: 1;
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.va-rosette-card--highlight {
  background: rgba(255,200,71,0.15);
  border-color: var(--fd-gold);
}
.va-rosette-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fd-mute);
  margin-bottom: 0.35rem;
}
.va-rosette-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1.3rem;
  line-height: 1.2;
  color: var(--fd-ink);
  margin-bottom: 0.35rem;
}
.va-rosette-pts {
  font-family: 'DM Mono', monospace;
  font-size: 2rem;
  font-weight: 500;
  color: var(--fd-ink);
  font-variant-aumeric: tabular-nums;
  line-height: 1;
}
.va-rosette-pts-unit {
  font-size: 0.9rem;
  color: var(--fd-mute);
}
.va-rosette-meta {
  font-family: 'Lexend', sans-serif;
  font-size: 0.78rem;
  color: var(--fd-mute);
  margin-top: 0.25rem;
}
.va-rival-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  position: relative;
}
.va-rival-vs-label {
  position: absolute;
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--fd-ink);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.va-rival-delta {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 100px;
  padding: 0.2rem 0.6rem;
  border: 1.5px solid var(--fd-ink);
}
.va-rival-delta--ahead { background: rgba(93,199,122,0.25); }
.va-rival-delta--behind { background: rgba(255,122,69,0.2); }

/* ── Full standings table ──────────────────────────────────────────── */
.va-standings-wrap {
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--fd-shadow);
  overflow: hidden;
}
.va-candy-rule {
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    var(--fd-sunset) 0px,
    var(--fd-sunset) 12px,
    var(--fd-gold) 12px,
    var(--fd-gold) 24px,
    var(--fd-grass) 24px,
    var(--fd-grass) 36px,
    var(--fd-sky) 36px,
    var(--fd-sky) 48px
  );
}
.va-standings-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Lexend', sans-serif;
  font-size: 0.85rem;
}
.va-th {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fd-mute);
  padding: 0.6rem 0.85rem;
  text-align: left;
  background: var(--fd-paper-deep);
  border-bottom: 2px solid var(--fd-ink);
}
.va-tr {
  border-bottom: 1.5px solid rgba(var(--fd-ink-rgb), 0.1);
  transition: background 80ms ease;
}
.va-tr:hover { background: var(--fd-paper-deep); }
.va-tr--top { background: rgba(255,200,71,0.06); }
.va-td {
  padding: 0.65rem 0.85rem;
  vertical-align: middle;
}
.va-td-rank {
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
}
.va-td-team {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
}
.va-td-team-name { margin-right: 0.35rem; }
.va-td-tour {
  font-family: 'Lexend', sans-serif;
  font-size: 0.8rem;
  color: var(--fd-mute);
  font-style: italic;
}
.va-td-num {
  font-family: 'DM Mono', monospace;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fd-mute);
  text-align: center;
}
.va-role-badge {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(93,185,245,0.2);
  border: 1.5px solid var(--fd-sky);
  border-radius: 100px;
  padding: 0.1rem 0.5rem;
}
.va-td-bar { min-width: 10rem; }
.va-bar {
  position: relative;
  height: 20px;
  background: var(--fd-paper-deep);
  border: 1.5px solid var(--fd-ink);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.va-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--fd-grass), var(--fd-sky));
  border-radius: 4px 0 0 4px;
  transition: width 0.5s ease;
}
.va-bar-num {
  position: relative;
  z-index: 1;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--fd-ink);
  padding-left: 0.5rem;
  font-variant-aumeric: tabular-nums;
}

/* ── Starting lineup ───────────────────────────────────────────────── */
.va-lineup-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.va-lineup-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: var(--fd-card);
  border: 2px solid var(--fd-ink);
  border-radius: 14px;
  box-shadow: 4px 4px 0 var(--fd-shadow);
  padding: 0.75rem 1rem;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.va-lineup-row:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--fd-shadow);
}
.va-lineup-num { flex-shrink: 0; }
.va-lineup-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.va-lineup-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.2;
}
.va-lineup-tour {
  font-family: 'Lexend', sans-serif;
  font-size: 0.75rem;
  color: var(--fd-mute);
  font-style: italic;
}
.va-lineup-role {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(93,185,245,0.2);
  border: 1.5px solid var(--fd-sky);
  border-radius: 100px;
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.va-lineup-role--captain {
  background: rgba(255,200,71,0.3);
  border-color: var(--fd-gold);
}
.va-lineup-pts {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 1.3rem;
  color: var(--fd-ink);
  font-variant-aumeric: tabular-nums;
  flex-shrink: 0;
}
.va-lineup-pts-unit {
  font-size: 0.65rem;
  color: var(--fd-mute);
  margin-left: 0.1rem;
}
.va-lineup-members {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}

/* ── Footer ribbon ─────────────────────────────────────────────────── */
.va-footer { margin-top: 2.5rem; display: flex; justify-content: center; }
.va-footer-ribbon {
  display: flex;
  align-items: stretch;
  color: #2a1f1a;
  background: var(--fd-sunset);
  min-height: 2.5rem;
}
.va-footer-tail {
  display: block;
  color: var(--fd-sunset);
  flex-shrink: 0;
  height: 2.5rem;
}
.va-footer-tail--left  { margin-left: -1px; }
.va-footer-tail--right { margin-right: -1px; }
.va-footer-label {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: #ffffff;
}
      `,
      }}
    />
  );
}
