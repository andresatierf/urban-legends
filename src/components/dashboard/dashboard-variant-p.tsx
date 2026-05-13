"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

export function DashboardVariantP({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);

  const weekNumber = getWeekNumber(new Date());

  const activeTeams = data.teams.filter(
    (t) => t.tournament.startDate <= today && t.tournament.endDate >= today,
  );

  // Top team by points for Tale of the Tape
  const sortedByPoints = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const userTopTeam = sortedByPoints[0] ?? null;

  // The "rival" is the team directly above userTopTeam — simulate with next entry or synthetic rival
  const rivalTeam =
    sortedByPoints.length > 1
      ? (sortedByPoints.find((t) => t.team._id !== userTopTeam?.team._id) ??
        null)
      : null;

  // Synthetic rival when only one team (still need a rival for the Tale of the Tape)
  const rivalName = rivalTeam?.team.name ?? "Iron Wolves";
  const rivalPoints = rivalTeam ? rivalTeam.team.points + 80 : 400;
  const rivalMembers = rivalTeam?.memberCount ?? 5;
  const rivalProgress = rivalTeam
    ? tournamentProgress(rivalTeam.tournament)
    : 0.72;

  const userProgress = userTopTeam
    ? tournamentProgress(userTopTeam.tournament)
    : 0;

  const hasUrgent = data.deadlines.some((d) => d.daysUntilEnd <= 3);

  // League standings: sort all teams by points desc
  const standings = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const maxPts = Math.max(...data.teams.map((t) => t.team.points), 1);

  // Team of the Day
  const todayStr = new Date().toISOString().slice(0, 10);
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

  // Metric cards derivations
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const activeDaysSet = new Set(
    data.activities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = last7Dates.filter((d) => activeDaysSet.has(d)).length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeekApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      new Date(a.timestamp).getTime() >= sevenDaysAgo,
  ).length;

  const todayApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      new Date(a.timestamp).toISOString().slice(0, 10) === today,
  ).length;

  // Squad rank: count teams in same tournament with strictly more points
  const squadRank =
    userTopTeam !== null
      ? data.teams.filter(
          (t) =>
            t.tournament._id === userTopTeam.tournament._id &&
            t.team.points > userTopTeam.team.points,
        ).length + 1
      : 1;

  // Sparkline helpers (7-day activity presence)
  const sparklineData = last7Dates
    .slice()
    .reverse()
    .map((d) => (activeDaysSet.has(d) ? 1 : 0));

  return (
    <>
      <VariantPStyles />
      <div className="vp-root">
        {/* Chalk dust grain overlay */}
        <div className="vp-dust" aria-hidden />

        {/* === CHALKBOARD HERO === */}
        <header className="vp-hero">
          <div className="vp-hero-inner">
            <div className="vp-hero-top-row">
              <ChalkDividerSvg />
              <span className="vp-week-label">WEEK {weekNumber}</span>
              <ChalkDividerSvg flip />
            </div>
            <h1 className="vp-greeting">
              <span className="vp-greeting-hey">HEY,</span>
              <span className="vp-greeting-name">{data.userName}</span>
            </h1>
            <p className="vp-hero-tagline">
              {activeTeams.length > 0
                ? `You're in ${activeTeams.length} active challenge${activeTeams.length !== 1 ? "s" : ""}. Get after it.`
                : "No active challenges. Find a tournament and suit up."}
            </p>
            <div className="vp-hero-cta">
              <ChalkArrowSvg />
              <span className="vp-cta-text">LOG TODAY&apos;S ACTIVITY</span>
            </div>
            <div className="vp-hero-stats-row">
              <HeroStat
                label="TOURNAMENTS"
                value={data.activeTournamentsCount}
              />
              <div className="vp-hero-stat-divider" aria-hidden>
                |
              </div>
              <HeroStat label="PENDING" value={data.pendingSubmissionsCount} />
              <div className="vp-hero-stat-divider" aria-hidden>
                |
              </div>
              <HeroStat label="INVITATIONS" value={data.invitationsCount} />
            </div>
          </div>
        </header>

        {/* === TALE OF THE TAPE === */}
        {userTopTeam && (
          <section className="vp-section vp-tape-section">
            <SectionHeader label="TALE OF THE TAPE" />
            <div className="vp-tape-card vp-paper-card">
              <TapeStrip corner="tl" />
              <TapeStrip corner="tr" />
              <TapeStrip corner="bl" />
              <TapeStrip corner="br" />
              <div className="vp-tape-columns">
                {/* User team column */}
                <div className="vp-tape-col vp-tape-col--user">
                  <div className="vp-tape-team-label">YOUR SQUAD</div>
                  <div className="vp-tape-team-name">
                    {userTopTeam.team.name}
                  </div>
                  <div className="vp-tape-role-badge">
                    {userTopTeam.userRole === "captain" ? "CAPTAIN" : "MEMBER"}
                  </div>
                  <div className="vp-tape-divider-h" aria-hidden />
                  <TapeStat
                    label="POINTS"
                    value={userTopTeam.team.points}
                    highlight
                  />
                  <TapeStat label="MEMBERS" value={userTopTeam.memberCount} />
                  <TapeStat
                    label="PROGRESS"
                    value={`${Math.round(userProgress * 100)}%`}
                  />
                  <TapeStat
                    label="TOURNAMENT"
                    value={userTopTeam.tournament.name}
                    small
                  />
                </div>

                {/* VS divider */}
                <div className="vp-tape-vs" aria-label="versus">
                  <div
                    className="vp-tape-vs-line vp-tape-vs-line--top"
                    aria-hidden
                  />
                  <span className="vp-tape-vs-text">VS</span>
                  <div
                    className="vp-tape-vs-line vp-tape-vs-line--bot"
                    aria-hidden
                  />
                </div>

                {/* Rival column */}
                <div className="vp-tape-col vp-tape-col--rival">
                  <div className="vp-tape-team-label">TOP RIVAL</div>
                  <div className="vp-tape-team-name">{rivalName}</div>
                  <div className="vp-tape-role-badge vp-tape-role-badge--rival">
                    OPPONENT
                  </div>
                  <div className="vp-tape-divider-h" aria-hidden />
                  <TapeStat
                    label="POINTS"
                    value={rivalPoints}
                    highlight
                    rival
                  />
                  <TapeStat label="MEMBERS" value={rivalMembers} rival />
                  <TapeStat
                    label="PROGRESS"
                    value={`${Math.round(rivalProgress * 100)}%`}
                    rival
                  />
                  <TapeStat
                    label="TOURNAMENT"
                    value={
                      rivalTeam
                        ? rivalTeam.tournament.name
                        : userTopTeam.tournament.name
                    }
                    small
                    rival
                  />
                </div>
              </div>
              {/* Points delta chalk-scratched */}
              <div className="vp-tape-delta">
                {userTopTeam.team.points >= rivalPoints ? (
                  <span className="vp-delta-ahead">
                    ↑ {userTopTeam.team.points - rivalPoints} pts ahead
                  </span>
                ) : (
                  <span className="vp-delta-behind">
                    ↓ {rivalPoints - userTopTeam.team.points} pts behind
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* === METRIC CARDS === */}
        <section
          className="vp-section vp-section--metrics vp-anim-fadeup"
          style={{ "--vp-anim-delay": "0ms" } as React.CSSProperties}
        >
          <SectionHeader label="YOUR NUMBERS" />
          <div className="vp-metrics-row">
            <MetricCard
              label="STREAK"
              value={streakDays}
              unit="DAYS"
              sparkline={sparklineData}
              accent="yellow"
            />
            <MetricCard
              label="THIS WEEK"
              value={thisWeekApproved}
              unit="APPROVED"
              sparkline={sparklineData}
              accent="green"
            />
            <MetricCard
              label="TODAY"
              value={todayApproved}
              unit="LOGGED"
              sparkline={sparklineData}
              accent="white"
            />
            <MetricCard
              label="SQUAD RANK"
              value={squadRank}
              unit="IN TOURNEY"
              sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
              accent="red"
            />
          </div>
        </section>

        {/* === SQUAD OF THE DAY === */}
        <section
          className="vp-section vp-anim-fadeup"
          style={{ "--vp-anim-delay": "100ms" } as React.CSSProperties}
        >
          <SectionHeader label="SQUAD OF THE DAY" />
          {mvpTeam ? (
            <div className="vp-mvp-card vp-paper-card">
              <TapeStrip corner="tl" />
              <TapeStrip corner="tr" />
              <TapeStrip corner="bl" />
              <TapeStrip corner="br" />
              <div className="vp-mvp-trophy" aria-hidden>
                <ChalkTrophySvg />
              </div>
              <div className="vp-mvp-body">
                <div className="vp-mvp-stamp">MVP</div>
                <div className="vp-mvp-name">{mvpTeam.team.name}</div>
                <p className="vp-mvp-detail">
                  {mvpDisplayCount} submission
                  {mvpDisplayCount === 1 ? "" : "s"}{" "}
                  {mvpCountToday > 0 ? "today" : "this period"} —{" "}
                  <strong>{mvpTeam.tournament.name}</strong>
                </p>
                <p className="vp-mvp-detail">
                  {mvpTeam.memberCount} member
                  {mvpTeam.memberCount === 1 ? "" : "s"}{" "}
                  {mvpTeam.userRole === "captain" ? "★ captain" : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="vp-mvp-card vp-paper-card">
              <TapeStrip corner="tl" />
              <TapeStrip corner="tr" />
              <TapeStrip corner="bl" />
              <TapeStrip corner="br" />
              <div className="vp-mvp-body">
                <div className="vp-mvp-stamp">MVP</div>
                <div className="vp-mvp-name">No squad yet</div>
                <p className="vp-mvp-detail">Join a tournament to compete</p>
              </div>
            </div>
          )}
        </section>

        {/* === LEAGUE STANDINGS === */}
        {standings.length > 0 && (
          <section
            className="vp-section vp-anim-fadeup"
            style={{ "--vp-anim-delay": "200ms" } as React.CSSProperties}
          >
            <SectionHeader label="LEAGUE STANDINGS" />
            <div className="vp-standings-wrap">
              <table className="vp-standings-table">
                <thead>
                  <tr className="vp-standings-head">
                    <th className="vp-standings-th vp-standings-th--rank">#</th>
                    <th className="vp-standings-th">TEAM</th>
                    <th className="vp-standings-th vp-standings-th--hide-sm">
                      TOURNAMENT
                    </th>
                    <th className="vp-standings-th vp-standings-th--hide-sm">
                      ROLE
                    </th>
                    <th className="vp-standings-th vp-standings-th--num">
                      MBR
                    </th>
                    <th className="vp-standings-th vp-standings-th--pts">
                      POINTS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team._id} className="vp-standings-row">
                      <td className="vp-standings-rank">
                        <span
                          className={`vp-rank-num${i === 0 ? " vp-rank-num--1st" : i === 1 ? " vp-rank-num--2nd" : i === 2 ? " vp-rank-num--3rd" : ""}`}
                        >
                          {i === 0
                            ? "1ST"
                            : i === 1
                              ? "2ND"
                              : i === 2
                                ? "3RD"
                                : String(i + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="vp-standings-team">
                        <span className="vp-standings-name">{t.team.name}</span>
                        {t.userRole === "captain" && (
                          <span
                            className="vp-standings-cap"
                            aria-label="captain"
                          >
                            ★
                          </span>
                        )}
                      </td>
                      <td className="vp-standings-tour vp-standings-td--hide-sm">
                        {t.tournament.name}
                      </td>
                      <td className="vp-standings-td--hide-sm">
                        <span className="vp-standings-role">
                          {t.userRole.toUpperCase()}
                        </span>
                      </td>
                      <td className="vp-standings-num">
                        {String(t.memberCount).padStart(2, "0")}
                      </td>
                      <td className="vp-standings-pts-cell">
                        <div className="vp-standings-bar">
                          <div
                            className="vp-standings-bar-fill"
                            style={
                              {
                                "--vp-bar-w": `${(t.team.points / maxPts) * 100}%`,
                              } as React.CSSProperties
                            }
                          />
                          <span className="vp-standings-bar-num">
                            {t.team.points}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* === TODAY'S LINEUP === */}
        <section className="vp-section">
          <SectionHeader label="TODAY'S LINEUP" />
          <div className="vp-lineup-list">
            {data.teams.length === 0 && (
              <p className="vp-empty">No teams on the roster yet.</p>
            )}
            {data.teams.map((t, idx) => (
              <div key={t.team._id} className="vp-jersey-row vp-paper-card">
                <TapeStrip corner="tl" slim />
                <TapeStrip corner="tr" slim />
                <div className="vp-jersey-number">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="vp-jersey-info">
                  <span className="vp-jersey-name">{t.team.name}</span>
                  <span className="vp-jersey-tour">{t.tournament.name}</span>
                </div>
                <div className="vp-jersey-right">
                  <span
                    className={`vp-jersey-badge vp-jersey-badge--${t.userRole}`}
                  >
                    {t.userRole === "captain" ? "C" : "M"}
                  </span>
                  <span className="vp-jersey-pts">{t.team.points}</span>
                  <span className="vp-jersey-pts-label">pts</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === GAME TAPE === */}
        <section className="vp-section">
          <SectionHeader label="GAME TAPE" sub="COACH'S NOTES" />
          <div className="vp-gametape-list">
            {data.activities.length === 0 && (
              <p className="vp-empty">No plays on tape yet.</p>
            )}
            {data.activities.map((a, i) => (
              <div key={i} className="vp-tape-note">
                <div className="vp-tape-note-marker">
                  <ActivityMarker type={a.type} />
                </div>
                <div className="vp-tape-note-body">
                  <span className="vp-tape-note-desc">{a.description}</span>
                  <span className="vp-tape-note-time">
                    — {formatRelative(a.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === COACH'S BOARD (urgent deadlines) === */}
        {data.deadlines.length > 0 && (
          <section className="vp-section">
            <SectionHeader label="COACH'S BOARD" urgent={hasUrgent} />
            <div className="vp-board-list">
              {data.deadlines.map((d) => (
                <div
                  key={d.tournament._id}
                  className={`vp-board-item${d.daysUntilEnd <= 3 ? " vp-board-item--urgent" : ""}`}
                >
                  <CircledNumber
                    value={d.daysUntilEnd}
                    urgent={d.daysUntilEnd <= 3}
                  />
                  <div className="vp-board-text">
                    <span className="vp-board-name">{d.tournament.name}</span>
                    <span className="vp-board-sub">
                      {d.daysUntilEnd <= 1
                        ? "CLOSES TOMORROW — SUBMIT NOW!"
                        : `${d.daysUntilEnd} days remaining`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === BENCH (invitations & join requests) === */}
        {(data.invitations.length > 0 || data.joinRequests.length > 0) && (
          <section className="vp-section">
            <SectionHeader label="THE BENCH" />
            <div className="vp-bench-grid">
              {data.invitations.map((inv) => (
                <div key={inv.id} className="vp-bench-card vp-paper-card">
                  <TapeStrip corner="tl" slim />
                  <TapeStrip corner="tr" slim />
                  <div className="vp-bench-type">INVITATION</div>
                  <div className="vp-bench-name">{inv.teamName}</div>
                  <div className="vp-bench-meta">
                    {inv.tournamentName}
                    <br />
                    from {inv.invitedBy} · {formatRelative(inv.timestamp)}
                  </div>
                  <div className="vp-bench-actions">
                    <button className="vp-btn vp-btn--accept">SUIT UP</button>
                    <button className="vp-btn vp-btn--decline">BENCHED</button>
                  </div>
                </div>
              ))}
              {data.joinRequests.map((jr) => (
                <div key={jr.id} className="vp-bench-card vp-paper-card">
                  <TapeStrip corner="tl" slim />
                  <TapeStrip corner="tr" slim />
                  <div className="vp-bench-type vp-bench-type--request">
                    JOIN REQUEST
                  </div>
                  <div className="vp-bench-name">{jr.userName}</div>
                  <div className="vp-bench-meta">
                    wants to join {jr.teamName}
                    <br />
                    {formatRelative(jr.timestamp)}
                  </div>
                  <div className="vp-bench-actions">
                    <button className="vp-btn vp-btn--accept">CALL UP</button>
                    <button className="vp-btn vp-btn--decline">
                      TRY OUT LATER
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === COACH MODE (admin) === */}
        {data.isAdmin && data.adminStats && (
          <section className="vp-section">
            <SectionHeader label="COACH MODE" badge="ADMIN" />
            <div className="vp-coach-board vp-paper-card vp-coach-board-paper">
              <TapeStrip corner="tl" />
              <TapeStrip corner="tr" />
              <TapeStrip corner="bl" />
              <TapeStrip corner="br" />
              <div className="vp-coach-grid">
                <CoachStat
                  label="PLAYERS"
                  value={data.adminStats.users.total}
                  sub={`+${data.adminStats.users.newThisWeek} this week`}
                />
                <CoachStat
                  label="ACTIVE TOURNAMENTS"
                  value={data.adminStats.tournaments.active}
                  sub={`${data.adminStats.tournaments.upcoming} upcoming`}
                />
                <CoachStat
                  label="TEAMS"
                  value={data.adminStats.teams.total}
                  sub="registered"
                />
                <CoachStat
                  label="REVIEW QUEUE"
                  value={data.adminStats.submissions.pending}
                  sub="pending approval"
                  urgent={data.adminStats.submissions.pending > 10}
                />
                <CoachStat
                  label="APPROVED"
                  value={data.adminStats.submissions.approved}
                  sub="submissions"
                />
                <CoachStat
                  label="APPROVAL RATE"
                  value={`${Math.round(
                    (data.adminStats.submissions.approved /
                      Math.max(
                        data.adminStats.submissions.approved +
                          data.adminStats.submissions.rejected,
                        1,
                      )) *
                      100,
                  )}%`}
                  sub="all time"
                />
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="vp-footer">
          <ChalkDividerSvg />
          <span className="vp-footer-text">
            URBAN LEGENDS LOCKER ROOM · {today}
          </span>
          <ChalkDividerSvg flip />
        </footer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helper calculations
// ---------------------------------------------------------------------------

function getWeekNumber(d: Date): number {
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 3600 * 1000;
  return Math.ceil(diff / oneWeek + 1);
}

function tournamentProgress(t: { startDate: string; endDate: string }): number {
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  label,
  sub,
  badge,
  urgent,
}: {
  label: string;
  sub?: string;
  badge?: string;
  urgent?: boolean;
}) {
  return (
    <div className="vp-section-header">
      <span
        className={`vp-section-label${urgent ? " vp-section-label--urgent" : ""}`}
      >
        {label}
      </span>
      {sub && <span className="vp-section-sub">{sub}</span>}
      {badge && <span className="vp-section-badge">{badge}</span>}
      <div className="vp-section-underline" aria-hidden />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="vp-hero-stat">
      <span className="vp-hero-stat-value">{value}</span>
      <span className="vp-hero-stat-label">{label}</span>
    </div>
  );
}

function TapeStat({
  label,
  value,
  highlight,
  rival,
  small,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  rival?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`vp-tape-stat${rival ? " vp-tape-stat--rival" : ""}`}>
      <span className="vp-tape-stat-label">{label}</span>
      <span
        className={`vp-tape-stat-value${highlight ? (rival ? " vp-tape-stat-value--rival-hl" : " vp-tape-stat-value--hl") : ""}${small ? " vp-tape-stat-value--small" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function ActivityMarker({ type }: { type: string }) {
  if (type === "submission_approved") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="7" stroke="#f5f0c8" strokeWidth="1.5" />
        <path
          d="M4.5 8L7 10.5 11.5 5.5"
          stroke="#f5f0c8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "submission_rejected") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="7" stroke="#e05050" strokeWidth="1.5" />
        <path
          d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5"
          stroke="#e05050"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "team_member_joined") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="7" stroke="#d4c48a" strokeWidth="1.5" />
        <path
          d="M8 5v6M5 8h6"
          stroke="#d4c48a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r="7"
        stroke="rgba(245,240,200,0.4)"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="8" r="2" fill="rgba(245,240,200,0.5)" />
    </svg>
  );
}

function CircledNumber({ value, urgent }: { value: number; urgent: boolean }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      className="vp-circle-num"
      aria-hidden
    >
      {/* Slightly rough hand-drawn circle */}
      <ellipse
        cx="22"
        cy="22"
        rx="18"
        ry="17"
        stroke={urgent ? "#e05050" : "#f5f0c8"}
        strokeWidth="2"
        strokeDasharray="4 2"
        transform="rotate(-8 22 22)"
      />
      <text
        x="22"
        y="28"
        textAnchor="middle"
        fill={urgent ? "#e05050" : "#f5f0c8"}
        fontFamily="'Permanent Marker', cursive"
        fontSize="16"
      >
        {value}
      </text>
    </svg>
  );
}

function CoachStat({
  label,
  value,
  sub,
  urgent,
}: {
  label: string;
  value: string | number;
  sub: string;
  urgent?: boolean;
}) {
  return (
    <div className="vp-coach-stat">
      <span
        className={`vp-coach-stat-value${urgent ? " vp-coach-stat-value--urgent" : ""}`}
      >
        {value}
      </span>
      <span className="vp-coach-stat-label">{label}</span>
      <span className="vp-coach-stat-sub">{sub}</span>
    </div>
  );
}

// Masking-tape strips at card corners
function TapeStrip({
  corner,
  slim,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  slim?: boolean;
}) {
  return (
    <div
      className={`vp-tape-strip vp-tape-strip--${corner}${slim ? " vp-tape-strip--slim" : ""}`}
      aria-hidden
    />
  );
}

function MetricCard({
  label,
  value,
  unit,
  sparkline,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  sparkline: number[];
  accent: "yellow" | "green" | "white" | "red";
}) {
  const accentColor =
    accent === "yellow"
      ? "#f5c842"
      : accent === "green"
        ? "#7ec87e"
        : accent === "red"
          ? "#e05050"
          : "#f5f0c8";

  const max = Math.max(...sparkline, 1);
  const W = 60;
  const H = 22;
  const pts = sparkline
    .map((v, i) => {
      const x = (i / Math.max(sparkline.length - 1, 1)) * W;
      const y = H - (v / max) * (H - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="vp-metric-card vp-paper-card">
      <div
        className="vp-metric-accent-rule"
        style={{ background: accentColor }}
      />
      <span className="vp-metric-label">{label}</span>
      <span
        className="vp-metric-value"
        style={{
          color: accentColor,
          textShadow: `0 0 18px ${accentColor}55, 1px 1px 4px rgba(0,0,0,0.5)`,
        }}
      >
        {value}
      </span>
      <span className="vp-metric-unit">{unit}</span>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="vp-metric-sparkline"
        aria-hidden
      >
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(245,240,200,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 3px rgba(245,240,200,0.4))" }}
        />
      </svg>
    </div>
  );
}

function ChalkTrophySvg() {
  return (
    <svg width="52" height="56" viewBox="0 0 52 56" fill="none" aria-hidden>
      {/* Cup body */}
      <path
        d="M16 8 Q14 22 20 28 Q23 31 26 31 Q29 31 32 28 Q38 22 36 8 Z"
        stroke="#f5c842"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(245,200,66,0.08)"
        strokeDasharray="5 2"
      />
      {/* Left handle */}
      <path
        d="M16 12 Q10 12 10 18 Q10 24 16 24"
        stroke="#f5c842"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="3 2"
      />
      {/* Right handle */}
      <path
        d="M36 12 Q42 12 42 18 Q42 24 36 24"
        stroke="#f5c842"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="3 2"
      />
      {/* Stem */}
      <path
        d="M26 31 L26 40"
        stroke="#f5c842"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
      {/* Base */}
      <path
        d="M18 40 Q26 38 34 40"
        stroke="#f5c842"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Star */}
      <text
        x="26"
        y="23"
        textAnchor="middle"
        fill="#f5c842"
        fontFamily="Permanent Marker, cursive"
        fontSize="10"
        opacity="0.7"
      >
        ★
      </text>
    </svg>
  );
}

function ChalkDividerSvg({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="80"
      height="10"
      viewBox="0 0 80 10"
      fill="none"
      className="vp-chalk-div"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M2 5 Q10 2 20 5 Q30 8 40 5 Q50 2 60 5 Q70 8 78 5"
        stroke="rgba(245,240,200,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ChalkArrowSvg() {
  return (
    <svg
      width="28"
      height="18"
      viewBox="0 0 28 18"
      fill="none"
      className="vp-chalk-arrow"
      aria-hidden
    >
      <path
        d="M2 9 Q8 6 16 9 Q22 11 26 9"
        stroke="#f5c842"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M21 5 L26 9 L21 13"
        stroke="#f5c842"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function VariantPStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Permanent+Marker&family=Special+Elite&family=DM+Mono:wght@400;500&display=swap');

        /* ===== TOKENS ===== */
        .vp-root {
          --vp-board: #1e2822;
          --vp-board2: #232d27;
          --vp-board-edge: #181f1b;
          --vp-chalk: #f5f0c8;
          --vp-chalk-dim: rgba(245,240,200,0.5);
          --vp-chalk-faint: rgba(245,240,200,0.22);
          --vp-chalk-yellow: #f5c842;
          --vp-chalk-red: #e05050;
          --vp-paper: #d4c38a;
          --vp-paper-bg: #ede0b0;
          --vp-paper-dark: #c4af74;
          --vp-tape: rgba(230,220,190,0.65);
          --vp-tape-shadow: rgba(0,0,0,0.35);
          --vp-ink: #1a1a18;

          position: relative;
          overflow: hidden;
          background: var(--vp-board);
          font-family: 'Caveat', cursive;
          color: var(--vp-chalk);
          padding: 0 0 2rem;
          border-radius: 4px;

          /* Subtle chalkboard texture via SVG noise */
          background-image:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='chalk'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feBlend in='SourceGraphic' mode='multiply'/></filter><rect width='100%25' height='100%25' filter='url(%23chalk)' opacity='0.06'/></svg>"),
            linear-gradient(175deg, #1e2822 0%, #1a2419 40%, #1e2822 100%);
        }

        /* Chalk dust top-layer */
        .vp-dust {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='d'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.8 0'/></filter><rect width='100%25' height='100%25' filter='url(%23d)'/></svg>");
        }

        /* All sections above dust */
        .vp-root > *:not(.vp-dust) {
          position: relative;
          z-index: 1;
        }

        /* ===== HERO ===== */
        .vp-hero {
          padding: 2rem 2rem 1.75rem;
          border-bottom: 1px solid var(--vp-chalk-faint);
          text-align: center;
        }
        .vp-hero-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .vp-hero-top-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .vp-week-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.32em;
          color: var(--vp-chalk-dim);
          text-transform: uppercase;
        }
        .vp-chalk-div {
          flex-shrink: 0;
        }

        .vp-greeting {
          margin: 0;
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .vp-greeting-hey {
          font-family: 'Caveat', cursive;
          font-size: 2rem;
          font-weight: 400;
          color: var(--vp-chalk-dim);
          letter-spacing: 0.04em;
        }
        /* Chalk-scratched look via text-shadow blur */
        .vp-greeting-name {
          font-family: 'Permanent Marker', cursive;
          font-size: 3.2rem;
          color: var(--vp-chalk);
          letter-spacing: 0.02em;
          text-shadow:
            1px 1px 0 rgba(245,240,200,0.15),
            -1px -1px 0 rgba(245,240,200,0.08),
            2px 2px 6px rgba(0,0,0,0.4);
        }

        .vp-hero-tagline {
          font-family: 'Caveat', cursive;
          font-size: 1.25rem;
          color: var(--vp-chalk-dim);
          margin: 0;
          letter-spacing: 0.03em;
        }

        .vp-hero-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .vp-chalk-arrow {
          flex-shrink: 0;
        }
        .vp-cta-text {
          font-family: 'Special Elite', cursive;
          font-size: 0.9rem;
          letter-spacing: 0.22em;
          color: var(--vp-chalk-yellow);
          /* underline via border instead of text-decoration for chalk feel */
          border-bottom: 1.5px dashed rgba(245,200,66,0.5);
          padding-bottom: 1px;
          text-shadow: 0 0 12px rgba(245,200,66,0.3);
        }

        .vp-hero-stats-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .vp-hero-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
        }
        .vp-hero-stat-value {
          font-family: 'Permanent Marker', cursive;
          font-size: 2.2rem;
          color: var(--vp-chalk-yellow);
          line-height: 1;
          text-shadow: 0 0 18px rgba(245,200,66,0.25), 1px 1px 4px rgba(0,0,0,0.5);
        }
        .vp-hero-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.57rem;
          letter-spacing: 0.24em;
          color: var(--vp-chalk-dim);
          text-transform: uppercase;
        }
        .vp-hero-stat-divider {
          font-family: 'Caveat', cursive;
          font-size: 2rem;
          color: var(--vp-chalk-faint);
          line-height: 1;
        }

        /* ===== SECTIONS ===== */
        .vp-section {
          padding: 1.5rem 1.75rem 0;
        }
        .vp-section-header {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          position: relative;
        }
        .vp-section-label {
          font-family: 'Special Elite', cursive;
          font-size: 1.05rem;
          letter-spacing: 0.18em;
          color: var(--vp-chalk);
          text-shadow: 1px 1px 0 rgba(245,240,200,0.12), 2px 2px 8px rgba(0,0,0,0.4);
          text-transform: uppercase;
        }
        .vp-section-label--urgent {
          color: var(--vp-chalk-red);
          text-shadow: 0 0 10px rgba(224,80,80,0.4), 1px 1px 4px rgba(0,0,0,0.4);
        }
        .vp-section-sub {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          color: var(--vp-chalk-faint);
          text-transform: uppercase;
        }
        .vp-section-badge {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vp-chalk-yellow);
          border: 1px solid rgba(245,200,66,0.4);
          padding: 0.15rem 0.5rem;
          border-radius: 3px;
          background: rgba(245,200,66,0.08);
        }
        /* Chalk-drawn underline as a pseudo-element squiggle approximation */
        .vp-section-underline {
          position: absolute;
          bottom: -6px;
          left: 0;
          right: 0;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            rgba(245,240,200,0.25) 0px,
            rgba(245,240,200,0.25) 6px,
            transparent 6px,
            transparent 10px
          );
          border-radius: 1px;
        }

        /* ===== PAPER CARDS (kraft-cream) ===== */
        .vp-paper-card {
          position: relative;
          background: var(--vp-paper-bg);
          color: var(--vp-ink);
          border-radius: 2px;
          /* Slight rotation applied per context via transform */
          box-shadow:
            0 2px 8px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.25);
        }

        /* Masking tape strips */
        .vp-tape-strip {
          position: absolute;
          width: 48px;
          height: 14px;
          background: var(--vp-tape);
          box-shadow: 0 1px 3px var(--vp-tape-shadow);
          z-index: 2;
        }
        .vp-tape-strip--slim {
          width: 36px;
          height: 10px;
        }
        .vp-tape-strip--tl { top: -5px; left: 12px; transform: rotate(-3deg); }
        .vp-tape-strip--tr { top: -5px; right: 12px; transform: rotate(3deg); }
        .vp-tape-strip--bl { bottom: -5px; left: 12px; transform: rotate(3deg); }
        .vp-tape-strip--br { bottom: -5px; right: 12px; transform: rotate(-3deg); }
        .vp-tape-strip--slim.vp-tape-strip--tl { top: -4px; left: 8px; }
        .vp-tape-strip--slim.vp-tape-strip--tr { top: -4px; right: 8px; }

        /* ===== TALE OF THE TAPE ===== */
        .vp-tape-section {}
        .vp-tape-card {
          transform: rotate(-0.5deg);
          padding: 1.5rem 1.25rem 1.25rem;
          margin-bottom: 0.25rem;
        }
        .vp-tape-columns {
          display: flex;
          align-items: flex-start;
          gap: 0;
        }
        .vp-tape-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }
        .vp-tape-col--user {
          text-align: left;
          padding-right: 1rem;
        }
        .vp-tape-col--rival {
          text-align: right;
          padding-left: 1rem;
        }
        .vp-tape-team-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          color: rgba(26,26,24,0.55);
          text-transform: uppercase;
        }
        .vp-tape-team-name {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.35rem;
          color: var(--vp-ink);
          line-height: 1.1;
          word-break: break-word;
        }
        .vp-tape-role-badge {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(26,26,24,0.75);
          background: rgba(0,0,0,0.08);
          padding: 0.15rem 0.5rem;
          border-radius: 2px;
          display: inline-block;
        }
        .vp-tape-role-badge--rival {
          color: rgba(26,26,24,0.55);
          background: rgba(0,0,0,0.05);
        }
        .vp-tape-divider-h {
          height: 1px;
          background: rgba(26,26,24,0.18);
          margin: 0.25rem 0;
        }
        .vp-tape-stat {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
        }
        .vp-tape-stat--rival {
          text-align: right;
        }
        .vp-tape-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.56rem;
          letter-spacing: 0.18em;
          color: rgba(26,26,24,0.45);
          text-transform: uppercase;
        }
        .vp-tape-stat-value {
          font-family: 'Caveat', cursive;
          font-size: 1.2rem;
          color: var(--vp-ink);
          line-height: 1.1;
          font-weight: 600;
        }
        .vp-tape-stat-value--hl {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.7rem;
          color: #1a3a1a;
        }
        .vp-tape-stat-value--rival-hl {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.7rem;
          color: #5a1a1a;
        }
        .vp-tape-stat-value--small {
          font-size: 0.85rem;
          font-family: 'Caveat', cursive;
          color: rgba(26,26,24,0.6);
        }

        /* VS divider */
        .vp-tape-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0.75rem;
          flex-shrink: 0;
          align-self: stretch;
          justify-content: center;
          gap: 0.35rem;
        }
        .vp-tape-vs-line--top,
        .vp-tape-vs-line--bot {
          width: 1px;
          flex: 1;
          background: rgba(26,26,24,0.2);
        }
        .vp-tape-vs-text {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.6rem;
          color: rgba(26,26,24,0.55);
          line-height: 1;
        }

        /* Points delta */
        .vp-tape-delta {
          margin-top: 1rem;
          text-align: center;
        }
        .vp-delta-ahead {
          font-family: 'Caveat', cursive;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a5a1a;
          letter-spacing: 0.04em;
        }
        .vp-delta-behind {
          font-family: 'Caveat', cursive;
          font-size: 1.1rem;
          font-weight: 600;
          color: #8a2020;
          letter-spacing: 0.04em;
        }

        /* ===== TODAY'S LINEUP ===== */
        .vp-lineup-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .vp-jersey-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.1rem;
        }
        /* Slight alternating rotation for taped-note feel */
        .vp-jersey-row:nth-child(odd) { transform: rotate(-0.4deg); }
        .vp-jersey-row:nth-child(even) { transform: rotate(0.3deg); }

        .vp-jersey-number {
          font-family: 'Permanent Marker', cursive;
          font-size: 2.2rem;
          color: rgba(26,26,24,0.55);
          line-height: 1;
          flex-shrink: 0;
          width: 2.5rem;
          text-align: right;
          letter-spacing: -0.03em;
        }
        .vp-jersey-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .vp-jersey-name {
          font-family: 'Caveat', cursive;
          font-size: 1.35rem;
          font-weight: 600;
          color: var(--vp-ink);
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vp-jersey-tour {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: rgba(26,26,24,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vp-jersey-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .vp-jersey-badge {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.15rem;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          line-height: 1;
        }
        .vp-jersey-badge--captain {
          background: rgba(180,140,0,0.2);
          color: #7a5c00;
          border: 1.5px solid rgba(180,140,0,0.5);
        }
        .vp-jersey-badge--member {
          background: rgba(26,26,24,0.1);
          color: rgba(26,26,24,0.55);
          border: 1.5px solid rgba(26,26,24,0.2);
        }
        .vp-jersey-pts {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.4rem;
          color: var(--vp-ink);
          line-height: 1;
        }
        .vp-jersey-pts-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          color: rgba(26,26,24,0.45);
        }

        /* ===== GAME TAPE ===== */
        .vp-gametape-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: rgba(245,240,200,0.04);
          border-left: 2px dashed rgba(245,240,200,0.18);
          padding-left: 1rem;
          margin-left: 0.5rem;
        }
        .vp-tape-note {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(245,240,200,0.08);
        }
        .vp-tape-note:last-child {
          border-bottom: none;
        }
        .vp-tape-note-marker {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .vp-tape-note-body {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .vp-tape-note-desc {
          font-family: 'Caveat', cursive;
          font-size: 1.1rem;
          color: var(--vp-chalk);
          letter-spacing: 0.02em;
          flex: 1;
          min-width: 0;
        }
        .vp-tape-note-time {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--vp-chalk-faint);
          flex-shrink: 0;
          white-space: nowrap;
        }

        /* ===== COACH'S BOARD ===== */
        .vp-board-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .vp-board-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--vp-chalk-faint);
        }
        .vp-board-item:last-child {
          border-bottom: none;
        }
        .vp-board-item--urgent .vp-board-text .vp-board-name {
          color: var(--vp-chalk-red);
          text-shadow: 0 0 8px rgba(224,80,80,0.3);
        }
        .vp-circle-num {
          flex-shrink: 0;
        }
        .vp-board-text {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .vp-board-name {
          font-family: 'Caveat', cursive;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--vp-chalk);
          line-height: 1.1;
        }
        .vp-board-sub {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          color: var(--vp-chalk-dim);
        }
        .vp-board-item--urgent .vp-board-sub {
          color: rgba(224,80,80,0.7);
        }

        /* ===== BENCH ===== */
        .vp-bench-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.25rem;
        }
        .vp-bench-card {
          padding: 1rem 1rem 0.85rem;
          transform: rotate(-0.8deg);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .vp-bench-card:nth-child(even) {
          transform: rotate(0.7deg);
        }
        .vp-bench-type {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(26,26,24,0.5);
        }
        .vp-bench-type--request {
          color: rgba(160,80,40,0.7);
        }
        .vp-bench-name {
          font-family: 'Caveat', cursive;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--vp-ink);
          line-height: 1.1;
        }
        .vp-bench-meta {
          font-family: 'Caveat', cursive;
          font-size: 0.95rem;
          color: rgba(26,26,24,0.6);
          line-height: 1.35;
        }
        .vp-bench-actions {
          display: flex;
          gap: 0.4rem;
          margin-top: 0.25rem;
        }
        .vp-btn {
          font-family: 'Special Elite', cursive;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          padding: 0.3rem 0.7rem;
          border-radius: 2px;
          cursor: pointer;
          border: none;
          text-transform: uppercase;
          transition: opacity 120ms ease;
        }
        .vp-btn:hover { opacity: 0.82; }
        .vp-btn--accept {
          background: rgba(20,60,20,0.85);
          color: rgba(220,250,200,0.9);
        }
        .vp-btn--decline {
          background: rgba(26,26,24,0.12);
          color: rgba(26,26,24,0.55);
          border: 1px solid rgba(26,26,24,0.2);
        }

        /* ===== COACH MODE (admin) ===== */
        .vp-coach-board {
          transform: rotate(0.3deg);
          padding: 1.5rem 1.5rem 1.25rem;
        }
        .vp-coach-board-paper {
          /* Slightly darker kraft for authority */
          background: #ddd0a0;
        }
        .vp-coach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1.25rem;
        }
        .vp-coach-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(26,26,24,0.15);
        }
        .vp-coach-stat-value {
          font-family: 'Permanent Marker', cursive;
          font-size: 2rem;
          color: var(--vp-ink);
          line-height: 1;
          text-shadow: 1px 1px 0 rgba(26,26,24,0.1);
        }
        .vp-coach-stat-value--urgent {
          color: #8a1a1a;
        }
        .vp-coach-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(26,26,24,0.55);
        }
        .vp-coach-stat-sub {
          font-family: 'Caveat', cursive;
          font-size: 0.9rem;
          color: rgba(26,26,24,0.45);
        }

        /* ===== EMPTY STATE ===== */
        .vp-empty {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--vp-chalk-faint);
          letter-spacing: 0.04em;
          padding: 0.5rem 0;
        }

        /* ===== FOOTER ===== */
        .vp-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin: 2rem 1.75rem 0;
          padding-top: 1rem;
          border-top: 1px dashed rgba(245,240,200,0.15);
          flex-wrap: wrap;
        }
        .vp-footer-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--vp-chalk-faint);
        }

        /* ===== ANIMATIONS ===== */
        @keyframes vp-fadeup {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vp-bar-fill {
          from { width: 0; }
          to   { width: var(--vp-bar-w, 0%); }
        }
        @keyframes vp-dust-drift {
          0%   { opacity: 0.04; }
          50%  { opacity: 0.07; }
          100% { opacity: 0.04; }
        }
        .vp-anim-fadeup {
          animation: vp-fadeup 0.45s ease both;
          animation-delay: var(--vp-anim-delay, 0ms);
        }
        .vp-standings-bar-fill {
          width: var(--vp-bar-w, 0%);
          animation: vp-bar-fill 0.6s ease both;
          animation-delay: 0.25s;
        }
        .vp-dust {
          animation: vp-dust-drift 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .vp-anim-fadeup { animation: none; opacity: 1; transform: none; }
          .vp-standings-bar-fill { animation: none; width: var(--vp-bar-w, 0%); }
          .vp-dust { animation: none; }
        }
        .vp-metric-card:hover,
        .vp-mvp-card:hover,
        .vp-bench-card:hover {
          transform: rotate(var(--vp-card-rot, -0.5deg)) translate(-2px, -2px);
          box-shadow:
            0 6px 18px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.25);
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        /* ===== METRIC CARDS ===== */
        .vp-metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
        }
        .vp-metric-card {
          padding: 0.85rem 0.9rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          --vp-card-rot: -0.6deg;
          transform: rotate(-0.6deg);
        }
        .vp-metric-card:nth-child(even) {
          --vp-card-rot: 0.5deg;
          transform: rotate(0.5deg);
        }
        .vp-metric-accent-rule {
          height: 3px;
          border-radius: 2px;
          margin-bottom: 0.4rem;
          opacity: 0.8;
        }
        .vp-metric-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.56rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(26,26,24,0.55);
        }
        .vp-metric-value {
          font-family: 'Permanent Marker', cursive;
          font-size: 2.4rem;
          line-height: 1;
        }
        .vp-metric-unit {
          font-family: 'DM Mono', monospace;
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(26,26,24,0.4);
        }
        .vp-metric-sparkline {
          margin-top: 0.35rem;
          width: 60px;
          display: block;
        }

        /* ===== MVP CARD ===== */
        .vp-mvp-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem 1.5rem;
          transform: rotate(-0.4deg);
          --vp-card-rot: -0.4deg;
        }
        .vp-mvp-trophy {
          flex-shrink: 0;
        }
        .vp-mvp-body {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 0;
        }
        .vp-mvp-stamp {
          font-family: 'Permanent Marker', cursive;
          font-size: 0.85rem;
          letter-spacing: 0.28em;
          color: rgba(200,60,60,0.7);
          border: 2px solid rgba(200,60,60,0.45);
          display: inline-block;
          padding: 0.1rem 0.55rem;
          border-radius: 3px;
          transform: rotate(-2deg);
          width: fit-content;
          text-shadow: 0 0 8px rgba(200,60,60,0.3);
        }
        .vp-mvp-name {
          font-family: 'Permanent Marker', cursive;
          font-size: 2rem;
          color: var(--vp-ink);
          line-height: 1.1;
          word-break: break-word;
          text-shadow: 1px 1px 0 rgba(26,26,24,0.1);
        }
        .vp-mvp-name::after {
          content: '';
          display: block;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            rgba(26,26,24,0.35) 0px,
            rgba(26,26,24,0.35) 6px,
            transparent 6px,
            transparent 10px
          );
          margin-top: 2px;
        }
        .vp-mvp-detail {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: rgba(26,26,24,0.65);
          margin: 0;
          line-height: 1.35;
        }
        .vp-mvp-detail strong {
          font-weight: 700;
          color: rgba(26,26,24,0.85);
        }

        /* ===== LEAGUE STANDINGS ===== */
        .vp-standings-wrap {
          overflow-x: auto;
          border-left: 2px dashed rgba(245,240,200,0.18);
          padding-left: 0.5rem;
        }
        .vp-standings-table {
          width: 100%;
          border-collapse: collapse;
        }
        .vp-standings-head tr {
          border-bottom: 2px solid rgba(245,240,200,0.25);
        }
        .vp-standings-th {
          font-family: 'DM Mono', monospace;
          font-size: 0.56rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vp-chalk-dim);
          padding: 0 0.75rem 0.6rem 0;
          text-align: left;
          white-space: nowrap;
        }
        .vp-standings-th--rank { width: 4rem; }
        .vp-standings-th--num  { width: 3.5rem; text-align: center; }
        .vp-standings-th--pts  { width: 14rem; }
        .vp-standings-row {
          border-bottom: 1px dashed rgba(245,240,200,0.1);
        }
        .vp-standings-row:last-child { border-bottom: none; }
        .vp-standings-row td,
        .vp-standings-head th {
          padding: 0.5rem 0.75rem 0.5rem 0;
        }
        .vp-standings-row:nth-child(1) { background: rgba(245,200,66,0.05); }
        .vp-standings-row:nth-child(2) { background: rgba(245,240,200,0.03); }
        .vp-standings-row:nth-child(3) { background: rgba(245,200,66,0.02); }
        .vp-standings-rank { width: 4rem; }
        .vp-rank-num {
          font-family: 'Permanent Marker', cursive;
          font-size: 1.15rem;
          color: var(--vp-chalk-dim);
          letter-spacing: -0.02em;
        }
        .vp-rank-num--1st {
          color: var(--vp-chalk-yellow);
          text-shadow: 0 0 14px rgba(245,200,66,0.45);
          font-size: 1.3rem;
        }
        .vp-rank-num--2nd {
          color: rgba(245,240,200,0.85);
          font-size: 1.2rem;
        }
        .vp-rank-num--3rd {
          color: rgba(245,200,66,0.65);
          font-size: 1.15rem;
        }
        .vp-standings-team { min-width: 0; }
        .vp-standings-name {
          font-family: 'Caveat', cursive;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--vp-chalk);
          line-height: 1.1;
          margin-right: 0.4rem;
        }
        .vp-standings-cap {
          font-family: 'Caveat', cursive;
          font-size: 0.85rem;
          color: var(--vp-chalk-yellow);
          letter-spacing: 0.05em;
        }
        .vp-standings-tour {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--vp-chalk-faint);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          display: block;
        }
        .vp-standings-role {
          font-family: 'DM Mono', monospace;
          font-size: 0.56rem;
          letter-spacing: 0.16em;
          color: var(--vp-chalk-dim);
          text-transform: uppercase;
        }
        .vp-standings-num {
          font-family: 'Permanent Marker', cursive;
          font-size: 1rem;
          color: var(--vp-chalk-dim);
          text-align: center;
        }
        .vp-standings-pts-cell { min-width: 8rem; }
        .vp-standings-bar {
          position: relative;
          height: 20px;
          background: rgba(245,240,200,0.08);
          border-radius: 2px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .vp-standings-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(245,200,66,0.55) 0%,
            rgba(245,200,66,0.35) 100%
          );
          border-radius: 2px;
        }
        .vp-standings-bar-num {
          position: relative;
          z-index: 1;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--vp-chalk);
          padding-left: 0.45rem;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 600px) {
          .vp-greeting-name { font-size: 2.4rem; }
          .vp-tape-columns { flex-direction: column; }
          .vp-tape-col--user { padding-right: 0; text-align: center; }
          .vp-tape-col--rival { padding-left: 0; text-align: center; }
          .vp-tape-stat--rival { text-align: center; }
          .vp-tape-vs { flex-direction: row; padding: 0.75rem 0; }
          .vp-tape-vs-line--top, .vp-tape-vs-line--bot { flex: none; width: 40px; height: 1px; }
          .vp-coach-grid { grid-template-columns: repeat(2, 1fr); }
          .vp-standings-th--hide-sm { display: none; }
          .vp-standings-td--hide-sm { display: none; }
          .vp-metrics-row { grid-template-columns: repeat(2, 1fr); }
          .vp-mvp-card { flex-direction: column; text-align: center; }
        }
        `,
      }}
    />
  );
}
