"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

/**
 * Variant N — Field Day (Office Sports Day)
 *
 * Friendly office sports day / summer camp scoreboard. Warm, energetic,
 * celebratory — but not aggressive. Ribbon banners, podiums, medals,
 * confetti dots, hand-drawn SVG icons. Paper cream background, chunky
 * ink-bordered cards with hard offset shadows.
 */
export function DashboardVariantN({ data }: { data: DashboardFixtureData }) {
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

  // Podium: top 3 teams by points
  const podiumTeams = [...data.teams]
    .sort((a, b) => b.team.points - a.team.points)
    .slice(0, 3);

  // Full standings sorted by points
  const standings = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const maxPts = Math.max(...data.teams.map((t) => t.team.points), 1);

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
  const totalQueue =
    data.invitations.length +
    data.joinRequests.length +
    data.pendingSubmissions.length;

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

  // ── Top Rival ──
  const rival =
    standings.length > 1
      ? (standings.find((t) => t.team._id !== userTopTeam?.team._id) ?? null)
      : null;
  const rivalDelta =
    userTopTeam && rival ? userTopTeam.team.points - rival.team.points : 0;

  return (
    <>
      <VariantNStyles />
      <div className="variant-n">
        {/* Paper texture overlay */}
        <svg
          aria-hidden
          className="vn-paper-texture"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <filter id="vn-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect
            width="100%"
            height="100%"
            filter="url(#vn-noise)"
            opacity="0.04"
          />
        </svg>

        {/* ── 1. HERO SCOREBOARD ── */}
        <section className="vn-hero">
          <Confetti />
          <RibbonBanner label={`WEEK ${weekNo} · FIELD DAY`} />
          <h1 className="vn-hero-greeting">
            Welcome to the field, {data.userName} 🎽
          </h1>
          <p className="vn-hero-sub">
            Here&apos;s how today&apos;s shaping up.
          </p>

          <div className="vn-stat-strip">
            <StatChip
              label="ACTIVE CHALLENGES"
              value={data.activeTournamentsCount}
            />
            <StatChip label="YOUR TEAMS" value={data.teams.length} />
            <StatChip label="IN THE QUEUE" value={totalQueue} />
            <StatChip
              label="WHISTLES BLOWN"
              value={data.deadlines.length}
              accent={urgentDeadlines.length > 0}
            />
          </div>
        </section>

        {/* ── 2. PODIUM ── */}
        {podiumTeams.length > 0 && (
          <section className="vn-section">
            <RibbonBanner label="STANDINGS" small />
            <div className="vn-podium-wrap">
              <Podium teams={podiumTeams} />
            </div>
          </section>
        )}

        {/* ── 2b. METRIC CARDS ── */}
        <section
          className="vn-section vn-section--fadein"
          style={{ animationDelay: "100ms" }}
        >
          <RibbonBanner label="FIELD STATS" small />
          <div className="vn-metrics-grid">
            <MetricTile
              label="STREAK"
              value={streakDays}
              unit="DAYS"
              color="var(--vn-sky)"
              sparkline={last7
                .slice()
                .reverse()
                .map((d) => (activeDaySet.has(d) ? 1 : 0))}
            />
            <MetricTile
              label="THIS WEEK"
              value={weekApproved}
              unit="APPROVED"
              color="var(--vn-grass)"
              sparkline={sparkline}
            />
            <MetricTile
              label="TODAY"
              value={todayApproved}
              unit="LOGGED"
              color="var(--vn-sunset)"
              sparkline={sparkline}
            />
            <MetricTile
              label="SQUAD RANK"
              value={squadRank}
              unit={`OF ${Math.max(standings.length, 1)}`}
              color="var(--vn-plum)"
              sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
            />
          </div>
        </section>

        {/* ── 2c. TOP RIVAL ── */}
        {userTopTeam && rival && (
          <section
            className="vn-section vn-section--fadein"
            style={{ animationDelay: "200ms" }}
          >
            <RibbonBanner label="TALE OF THE TAPE" small />
            <div className="vn-rival-wrap">
              <RosetteTile team={userTopTeam} label="YOU" highlight />
              <div className="vn-rival-vs">
                <svg aria-hidden width="56" height="56" viewBox="0 0 56 56">
                  <path
                    d="M4 4 L52 4 L52 52 L4 52 Z"
                    fill="var(--vn-gold)"
                    stroke="var(--vn-ink)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    transform="rotate(45 28 28) scale(0.68) translate(8 8)"
                  />
                </svg>
                <span className="vn-rival-vs-label">VS</span>
                <div
                  className={`vn-rival-delta ${rivalDelta >= 0 ? "vn-rival-delta--ahead" : "vn-rival-delta--behind"}`}
                >
                  {rivalDelta >= 0
                    ? `AHEAD BY ${rivalDelta}`
                    : `BEHIND BY ${Math.abs(rivalDelta)}`}
                </div>
              </div>
              <RosetteTile team={rival} label="RIVAL" />
            </div>
          </section>
        )}

        {/* ── 2d. FULL STANDINGS TABLE ── */}
        {standings.length > 0 && (
          <section
            className="vn-section vn-section--fadein"
            style={{ animationDelay: "300ms" }}
          >
            <RibbonBanner label="FULL STANDINGS" small />
            <div className="vn-standings-wrap">
              <div className="vn-candy-rule" aria-hidden />
              <table className="vn-standings-table">
                <thead>
                  <tr>
                    <th className="vn-th">#</th>
                    <th className="vn-th">TEAM</th>
                    <th className="vn-th">TOURNAMENT</th>
                    <th className="vn-th">ROLE</th>
                    <th className="vn-th">MBR</th>
                    <th className="vn-th">POINTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => {
                    const rankEmojis = ["🥇", "🥈", "🥉"];
                    const rank =
                      i < 3 ? rankEmojis[i] : String(i + 1).padStart(2, "0");
                    const barPct = Math.round((t.team.points / maxPts) * 100);
                    return (
                      <tr
                        key={t.team._id}
                        className={`vn-tr ${i < 3 ? "vn-tr--top" : ""}`}
                      >
                        <td className="vn-td vn-td-rank">{rank}</td>
                        <td className="vn-td vn-td-team">
                          {i === 0 && <StarSvgSmall />}
                          <span className="vn-td-team-name">{t.team.name}</span>
                          {t.userRole === "captain" && (
                            <span className="vn-captain-badge">
                              <WhistleSvgSmall />
                              Captain
                            </span>
                          )}
                        </td>
                        <td className="vn-td vn-td-tour">
                          {t.tournament.name}
                        </td>
                        <td className="vn-td">
                          <span className="vn-role-badge">
                            {t.userRole.toUpperCase()}
                          </span>
                        </td>
                        <td className="vn-td vn-td-num">
                          {String(t.memberCount).padStart(2, "0")}
                        </td>
                        <td className="vn-td vn-td-bar">
                          <div className="vn-bar">
                            <div
                              className="vn-bar-fill vn-bar-fill--anim"
                              style={{ width: `${barPct}%` }}
                            />
                            <span className="vn-bar-num">{t.team.points}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="vn-candy-rule" aria-hidden />
            </div>
          </section>
        )}

        {/* ── 2e. TODAY'S LINEUP ── */}
        {data.teams.length > 0 && (
          <section
            className="vn-section vn-section--fadein"
            style={{ animationDelay: "400ms" }}
          >
            <RibbonBanner label="STARTING LINEUP" small />
            <div className="vn-lineup-wrap">
              {data.teams.map((t, i) => (
                <div key={t.team._id} className="vn-lineup-row">
                  <div className="vn-lineup-num">
                    <MedallionSvg number={i + 1} />
                  </div>
                  <div className="vn-lineup-info">
                    <span className="vn-lineup-name">{t.team.name}</span>
                    <span className="vn-lineup-tour">{t.tournament.name}</span>
                  </div>
                  <span
                    className={`vn-lineup-role ${t.userRole === "captain" ? "vn-lineup-role--captain" : ""}`}
                  >
                    {t.userRole.toUpperCase()}
                  </span>
                  <div className="vn-lineup-pts">
                    {t.team.points}{" "}
                    <span className="vn-lineup-pts-unit">PTS</span>
                  </div>
                  <div className="vn-lineup-members">
                    {Array.from({ length: Math.min(t.memberCount, 4) }).map(
                      (_, idx) => (
                        <span
                          key={idx}
                          className={`vn-avatar ${["vn-av-grass", "vn-av-sky", "vn-av-sunset", "vn-av-plum"][idx % 4]}`}
                        />
                      ),
                    )}
                    {t.memberCount > 4 && (
                      <span className="vn-avatar-more">
                        +{t.memberCount - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. SQUAD OF THE DAY ── */}
        <section className="vn-section">
          <RibbonBanner label="SQUAD OF THE DAY" small />
          {mvpTeam ? (
            <div className="vn-mvp-card">
              <div className="vn-mvp-trophy" aria-hidden>
                <TrophySvg />
              </div>
              <div className="vn-mvp-body">
                <div className="vn-mvp-ribbon">Star Crew</div>
                <div className="vn-mvp-name">{mvpTeam.team.name}</div>
                <p className="vn-mvp-detail">
                  {mvpDisplayCount} submission
                  {mvpDisplayCount === 1 ? "" : "s"}{" "}
                  {mvpCountToday > 0 ? "today" : "this period"} ·{" "}
                  <strong>{mvpTeam.tournament.name}</strong>
                </p>
                <p className="vn-mvp-detail">
                  {mvpTeam.memberCount} member
                  {mvpTeam.memberCount === 1 ? "" : "s"}
                  {mvpTeam.userRole === "captain" && (
                    <span className="vn-captain-badge">
                      <WhistleSvgSmall />
                      Captain
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="vn-mvp-card">
              <div className="vn-mvp-trophy" aria-hidden>
                <TrophySvg />
              </div>
              <div className="vn-mvp-body">
                <div className="vn-mvp-ribbon">Star Crew</div>
                <div className="vn-mvp-name">No teams yet</div>
                <p className="vn-mvp-detail">Join a tournament to compete.</p>
              </div>
            </div>
          )}
        </section>

        {/* ── 4. MY SQUADS ── */}
        {data.teams.length > 0 && (
          <section className="vn-section">
            <RibbonBanner label="MY SQUADS" small />
            <div className="vn-squads-grid">
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
        )}

        {/* ── 5. IN THE TIMEKEEPER'S QUEUE ── */}
        {(data.invitations.length > 0 ||
          data.joinRequests.length > 0 ||
          data.pendingSubmissions.length > 0 ||
          data.deadlines.length > 0) && (
          <section className="vn-section">
            <RibbonBanner label="IN THE TIMEKEEPER'S QUEUE" small />
            <div className="vn-queue-grid">
              {/* Left: invitations + join requests */}
              <div className="vn-queue-col">
                {data.invitations.map((inv) => (
                  <div key={inv.id} className="vn-rsvp-card">
                    <div className="vn-rsvp-tag">RSVP</div>
                    <div className="vn-rsvp-team">{inv.teamName}</div>
                    <div className="vn-rsvp-meta">
                      {inv.tournamentName} · invited by {inv.invitedBy}
                    </div>
                    <div className="vn-rsvp-time">
                      {formatRelative(inv.timestamp)}
                    </div>
                    <div className="vn-rsvp-actions">
                      <button className="vn-btn vn-btn--yes">
                        COUNT ME IN
                      </button>
                      <button className="vn-btn vn-btn--maybe">
                        MAYBE NEXT TIME
                      </button>
                    </div>
                  </div>
                ))}
                {data.joinRequests.map((jr) => (
                  <div
                    key={jr.id}
                    className="vn-rsvp-card vn-rsvp-card--request"
                  >
                    <div className="vn-rsvp-tag vn-rsvp-tag--plum">
                      JOIN REQUEST
                    </div>
                    <div className="vn-rsvp-team">{jr.userName}</div>
                    <div className="vn-rsvp-meta">
                      wants to join {jr.teamName}
                    </div>
                    <div className="vn-rsvp-time">
                      {formatRelative(jr.timestamp)}
                    </div>
                    <div className="vn-rsvp-actions">
                      <button className="vn-btn vn-btn--yes">
                        WELCOME ABOARD
                      </button>
                      <button className="vn-btn vn-btn--maybe">
                        NOT TODAY
                      </button>
                    </div>
                  </div>
                ))}
                {data.invitations.length === 0 &&
                  data.joinRequests.length === 0 && (
                    <div className="vn-queue-empty">
                      No pending RSVPs — you&apos;re all caught up.
                    </div>
                  )}
              </div>

              {/* Right: pending submissions + deadlines */}
              <div className="vn-queue-col">
                {data.pendingSubmissions.map((s) => {
                  const subDate = new Date(s.date);
                  const daysAgo = Math.round(
                    (Date.now() - subDate.getTime()) / 86_400_000,
                  );
                  return (
                    <div key={s.id} className="vn-pending-card">
                      <WhistleSvg />
                      <div className="vn-pending-body">
                        <div className="vn-pending-team">{s.teamName}</div>
                        <div className="vn-pending-tour">
                          {s.tournamentName}
                        </div>
                        <div className="vn-pending-note">
                          Logged {daysAgo} day{daysAgo === 1 ? "" : "s"} ago,
                          awaiting whistle
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.deadlines.map((d) => {
                  const urgent = d.daysUntilEnd <= 3;
                  return (
                    <div
                      key={d.tournament._id}
                      className={`vn-deadline-card${urgent ? " vn-deadline-card--urgent" : ""}`}
                    >
                      <StopwatchSvg urgent={urgent} />
                      <div className="vn-deadline-body">
                        <div className="vn-deadline-name">
                          {d.tournament.name}
                        </div>
                        <div
                          className={`vn-deadline-note${urgent ? " vn-deadline-note--urgent" : ""}`}
                        >
                          Final whistle in {d.daysUntilEnd} day
                          {d.daysUntilEnd === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.pendingSubmissions.length === 0 &&
                  data.deadlines.length === 0 && (
                    <div className="vn-queue-empty">
                      Queue is clear — nothing pending.
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. HIGHLIGHTS FROM THE FIELD ── */}
        {data.activities.length > 0 && (
          <section className="vn-section">
            <RibbonBanner label="HIGHLIGHTS FROM THE FIELD" small />
            <div className="vn-timeline">
              {data.activities.map((a, i) => {
                const dotClass = activityDotClass(a.type);
                return (
                  <div key={i} className="vn-timeline-row">
                    <div
                      className={`vn-timeline-dot ${dotClass}`}
                      aria-hidden
                    />
                    <div className="vn-timeline-time">
                      {formatRelative(a.timestamp)}
                    </div>
                    <div className="vn-timeline-desc">{a.description}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 7. COACH'S NOTES (admin only) ── */}
        {data.isAdmin && data.adminStats && (
          <section className="vn-section">
            <RibbonBanner label="COACH'S CLIPBOARD" small />
            <div className="vn-coach-card">
              <div className="vn-coach-grid">
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

        {/* ── 8. FOOTER RIBBON ── */}
        <footer className="vn-footer">
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
  if (type === "submission_approved") return "vn-dot--grass";
  if (type === "team_member_joined") return "vn-dot--sky";
  if (type.includes("join_request")) return "vn-dot--plum";
  if (type === "submission_rejected") return "vn-dot--sunset";
  return "vn-dot--mute";
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function RibbonBanner({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className={`vn-ribbon${small ? " vn-ribbon--small" : ""}`}>
      {/* Left notch */}
      <svg
        aria-hidden
        className="vn-ribbon-tail vn-ribbon-tail--left"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <div className="vn-ribbon-label">{label}</div>
      {/* Right notch */}
      <svg
        aria-hidden
        className="vn-ribbon-tail vn-ribbon-tail--right"
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
    { cls: "vn-confetti-1", color: "vn-c-grass" },
    { cls: "vn-confetti-2", color: "vn-c-sunset" },
    { cls: "vn-confetti-3", color: "vn-c-sky" },
    { cls: "vn-confetti-4", color: "vn-c-plum" },
    { cls: "vn-confetti-5", color: "vn-c-gold" },
    { cls: "vn-confetti-6", color: "vn-c-grass" },
    { cls: "vn-confetti-7", color: "vn-c-sunset" },
    { cls: "vn-confetti-8", color: "vn-c-sky" },
    { cls: "vn-confetti-9", color: "vn-c-plum" },
    { cls: "vn-confetti-10", color: "vn-c-gold" },
    { cls: "vn-confetti-11", color: "vn-c-grass" },
    { cls: "vn-confetti-12", color: "vn-c-sky" },
    { cls: "vn-confetti-13", color: "vn-c-sunset" },
    { cls: "vn-confetti-14", color: "vn-c-plum" },
    { cls: "vn-confetti-15", color: "vn-c-gold" },
  ];
  return (
    <>
      {dots.map((d) => (
        <span
          key={d.cls}
          className={`vn-confetti ${d.cls} ${d.color}`}
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
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`vn-stat-chip${accent ? " vn-stat-chip--accent" : ""}`}>
      <span className="vn-stat-num">{value}</span>
      <span className="vn-stat-label">{label}</span>
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
    <div className="vn-podium">
      {order.map((team, i) =>
        team ? (
          <div key={team.team.name} className="vn-podium-slot">
            <MedalSvg type={medals[i]} />
            <div className="vn-podium-name">{team.team.name}</div>
            <div className="vn-podium-pts">{team.team.points}</div>
            <div
              className={`vn-podium-block vn-podium-block--${medals[i]}`}
              style={{ height: `${heights[i]}px` }}
            >
              <span className="vn-podium-pos">{positions[i]}</span>
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
    "vn-av-grass",
    "vn-av-sky",
    "vn-av-sunset",
    "vn-av-plum",
    "vn-av-gold",
  ];
  const displayCount = Math.min(memberCount, 5);

  return (
    <div className="vn-team-card">
      <div className="vn-team-head">
        <div className="vn-team-name">
          {name}
          {isCaptain && (
            <span className="vn-captain-badge">
              <WhistleSvgSmall />
              Team Captain
            </span>
          )}
        </div>
        <div className="vn-team-pts">{points}</div>
      </div>
      <div className="vn-team-tour">{tournamentName}</div>
      <div className="vn-team-members">
        {Array.from({ length: displayCount }).map((_, idx) => (
          <span
            key={idx}
            className={`vn-avatar ${avatarColors[idx % avatarColors.length]}`}
          />
        ))}
        {memberCount > 5 && (
          <span className="vn-avatar-more">+{memberCount - 5}</span>
        )}
      </div>
      <div className="vn-progress-track">
        <div
          className="vn-progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <RunnerSvg progress={Math.min(progress, 100)} />
      </div>
      <div className="vn-progress-labels">
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
    <div className="vn-coach-stat">
      <CheckboxSvg checked={ok} />
      <div className="vn-coach-stat-body">
        <div className="vn-coach-stat-label">{label}</div>
        <div className="vn-coach-stat-value">
          {value}
          {unit && <span className="vn-coach-stat-unit">{unit}</span>}
        </div>
        <div className="vn-coach-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

function FooterRibbon({ date }: { date: string }) {
  return (
    <div className="vn-footer-ribbon">
      <svg
        aria-hidden
        className="vn-footer-tail vn-footer-tail--left"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <span className="vn-footer-label">
        GO TEAM &middot; {date} &middot; KEEP IT MOVING
      </span>
      <svg
        aria-hidden
        className="vn-footer-tail vn-footer-tail--right"
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
      className="vn-medal-svg"
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
        stroke="#2a1f1a"
        strokeWidth="2"
      />
      <circle
        cx="22"
        cy="34"
        r="11"
        fill="none"
        stroke="#2a1f1a"
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
        stroke="#2a1f1a"
        strokeWidth="2.5"
        fill="rgba(255,200,71,0.25)"
        strokeLinejoin="round"
      />
      {/* Handles */}
      <path
        d="M16 16 C8 16 8 28 16 28"
        stroke="#2a1f1a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 16 C56 16 56 28 48 28"
        stroke="#2a1f1a"
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
        stroke="#2a1f1a"
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
        stroke="#2a1f1a"
        strokeWidth="2"
        fill="rgba(255,200,71,0.3)"
      />
      {/* Star inside */}
      <path
        d="M32 18 L33.5 23 L38.5 23 L34.5 26 L36 31 L32 28 L28 31 L29.5 26 L25.5 23 L30.5 23 Z"
        fill="#ffc847"
        stroke="#2a1f1a"
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
      className="vn-whistle-svg"
    >
      <circle
        cx="9"
        cy="14"
        r="5"
        stroke="#2a1f1a"
        strokeWidth="2"
        fill="rgba(255,122,69,0.15)"
      />
      <path
        d="M14 14 L20 8"
        stroke="#2a1f1a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 6 L22 6"
        stroke="#2a1f1a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="9"
        x2="9"
        y2="11"
        stroke="#2a1f1a"
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
  const stroke = urgent ? "#e53e3e" : "#2a1f1a";
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="vn-stopwatch-svg"
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
      className="vn-runner"
      style={{ left: `calc(${progress}% - 9px)` }}
    >
      {/* Head */}
      <circle
        cx="9"
        cy="4"
        r="3"
        stroke="#2a1f1a"
        strokeWidth="1.5"
        fill="rgba(93,199,122,0.4)"
      />
      {/* Body */}
      <path
        d="M9 7 L9 16"
        stroke="#2a1f1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Arms */}
      <path
        d="M9 10 L5 13"
        stroke="#2a1f1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 10 L13 8"
        stroke="#2a1f1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Legs */}
      <path
        d="M9 16 L6 22"
        stroke="#2a1f1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16 L13 20"
        stroke="#2a1f1a"
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
      className="vn-checkbox-svg"
    >
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="4"
        stroke="#2a1f1a"
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
        fill="var(--vn-gold)"
        stroke="var(--vn-ink)"
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
        fill="var(--vn-paper-deep)"
        stroke="var(--vn-ink)"
        strokeWidth="2"
      />
      <circle
        cx="16"
        cy="16"
        r="10"
        fill="none"
        stroke="var(--vn-ink)"
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
        fill="var(--vn-ink)"
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
      className={`vn-rosette-card ${highlight ? "vn-rosette-card--highlight" : ""}`}
    >
      <div className="vn-rosette-label">{label}</div>
      <div className="vn-rosette-name">{team.team.name}</div>
      {team.userRole === "captain" && (
        <span className="vn-captain-badge" style={{ marginBottom: "0.5rem" }}>
          <WhistleSvgSmall />
          Captain
        </span>
      )}
      <div className="vn-rosette-pts">
        {team.team.points} <span className="vn-rosette-pts-unit">pts</span>
      </div>
      <div className="vn-rosette-meta">{team.memberCount} members</div>
      <div className="vn-progress-track" style={{ marginTop: "0.75rem" }}>
        <div className="vn-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="vn-progress-labels">
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
      className="vn-metric-tile"
      style={{ "--vn-metric-accent": color } as React.CSSProperties}
    >
      <div className="vn-metric-accent-rule" aria-hidden />
      <span className="vn-metric-label">{label}</span>
      <span className="vn-metric-value">{value}</span>
      <span className="vn-metric-unit">{unit}</span>
      <svg
        aria-hidden
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="vn-metric-sparkline"
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

function VariantNStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Funnel+Display:wght@700;800&family=Lexend:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

/* ── Token map ─────────────────────────────────────────────────────── */
.variant-n {
  --vn-paper:       #fffaf0;
  --vn-paper-deep:  #fbf3df;
  --vn-ink:         #2a1f1a;
  --vn-mute:        #7a6a5c;
  --vn-sunset:      #ff7a45;
  --vn-grass:       #5dc77a;
  --vn-sky:         #5db9f5;
  --vn-plum:        #a166d4;
  --vn-gold:        #ffc847;
  --vn-silver:      #c5cdd6;
  --vn-bronze:      #cd9352;
  --vn-shadow:      rgba(42,31,26,0.12);

  position: relative;
  overflow: hidden;
  font-family: 'Lexend', sans-serif;
  background: var(--vn-paper);
  color: var(--vn-ink);
  padding: 2rem 1.5rem 3rem;
  min-height: 100vh;
}

/* ── Paper texture ─────────────────────────────────────────────────── */
.vn-paper-texture {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ── Confetti dots ─────────────────────────────────────────────────── */
.vn-confetti {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.vn-c-grass  { background: var(--vn-grass); }
.vn-c-sunset { background: var(--vn-sunset); }
.vn-c-sky    { background: var(--vn-sky); }
.vn-c-plum   { background: var(--vn-plum); }
.vn-c-gold   { background: var(--vn-gold); }

.vn-confetti-1  { top: 4%;  left: 8%;  width: 10px; height: 10px; opacity: 0.55; }
.vn-confetti-2  { top: 7%;  left: 22%; width: 7px;  height: 7px;  opacity: 0.4;  }
.vn-confetti-3  { top: 3%;  left: 45%; width: 12px; height: 12px; opacity: 0.5;  }
.vn-confetti-4  { top: 9%;  left: 63%; width: 8px;  height: 8px;  opacity: 0.45; }
.vn-confetti-5  { top: 5%;  left: 78%; width: 10px; height: 10px; opacity: 0.5;  }
.vn-confetti-6  { top: 2%;  left: 91%; width: 7px;  height: 7px;  opacity: 0.4;  }
.vn-confetti-7  { top: 12%; left: 5%;  width: 6px;  height: 6px;  opacity: 0.35; }
.vn-confetti-8  { top: 11%; left: 35%; width: 9px;  height: 9px;  opacity: 0.4;  }
.vn-confetti-9  { top: 13%; left: 55%; width: 7px;  height: 7px;  opacity: 0.45; }
.vn-confetti-10 { top: 10%; left: 72%; width: 11px; height: 11px; opacity: 0.5;  }
.vn-confetti-11 { top: 15%; left: 88%; width: 8px;  height: 8px;  opacity: 0.4;  }
.vn-confetti-12 { top: 18%; left: 15%; width: 6px;  height: 6px;  opacity: 0.3;  }
.vn-confetti-13 { top: 17%; left: 50%; width: 9px;  height: 9px;  opacity: 0.35; }
.vn-confetti-14 { top: 20%; left: 82%; width: 7px;  height: 7px;  opacity: 0.3;  }
.vn-confetti-15 { top: 1%;  left: 58%; width: 6px;  height: 6px;  opacity: 0.35; }

/* ── Layout scaffolding ───────────────────────────────────────────── */
.variant-n > * { position: relative; z-index: 1; }
.vn-section { margin-top: 2.25rem; }

/* ── Ribbon banner ─────────────────────────────────────────────────── */
.vn-ribbon {
  display: flex;
  align-items: stretch;
  width: fit-content;
  margin: 0 auto 1.5rem;
  color: var(--vn-ink);
  background: var(--vn-gold);
  min-height: 3rem;
  position: relative;
}
.vn-ribbon--small {
  min-height: 2.25rem;
  margin-bottom: 1.25rem;
}
.vn-ribbon-tail {
  display: block;
  color: var(--vn-gold);
  flex-shrink: 0;
  height: 3rem;
}
.vn-ribbon--small .vn-ribbon-tail { height: 2.25rem; }
.vn-ribbon-tail--left  { margin-left: -1px; }
.vn-ribbon-tail--right { margin-right: -1px; }
.vn-ribbon-label {
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
.vn-ribbon--small .vn-ribbon-label { font-size: 0.8rem; }

/* ── Hero ──────────────────────────────────────────────────────────── */
.vn-hero {
  position: relative;
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 2.25rem 2rem 2rem;
  text-align: center;
  overflow: hidden;
}
.vn-hero-greeting {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: clamp(1.75rem, 4vw, 2.8rem);
  line-height: 1.1;
  margin: 1rem 0 0.45rem;
  color: var(--vn-ink);
}
.vn-hero-sub {
  font-family: 'Lexend', sans-serif;
  font-weight: 400;
  font-size: 1.05rem;
  color: var(--vn-mute);
  margin: 0 0 1.75rem;
}

/* ── Stat strip ────────────────────────────────────────────────────── */
.vn-stat-strip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}
@media (min-width: 640px) {
  .vn-stat-strip { grid-template-columns: repeat(4, 1fr); }
}
.vn-stat-chip {
  background: var(--vn-paper-deep);
  border: 2px solid var(--vn-ink);
  border-radius: 14px;
  box-shadow: 4px 4px 0 var(--vn-shadow);
  padding: 1rem 0.75rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.vn-stat-chip--accent { background: rgba(255,122,69,0.12); border-color: var(--vn-sunset); }
.vn-stat-num {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 2.2rem;
  line-height: 1;
  color: var(--vn-ink);
  font-variant-numeric: tabular-nums;
}
.vn-stat-label {
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vn-mute);
}

/* ── Podium ────────────────────────────────────────────────────────── */
.vn-podium-wrap {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 2rem 1.5rem 0;
  overflow: hidden;
}
.vn-podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
}
.vn-podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 200px;
}
.vn-medal-svg { margin-bottom: 0.35rem; }
.vn-podium-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.2rem;
  padding: 0 0.3rem;
  line-height: 1.2;
}
.vn-podium-pts {
  font-family: 'DM Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--vn-mute);
  margin-bottom: 0.5rem;
  font-variant-numeric: tabular-nums;
}
.vn-podium-block {
  width: 100%;
  border-radius: 8px 8px 0 0;
  border: 2px solid var(--vn-ink);
  border-bottom: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.6rem;
}
.vn-podium-block--gold   { background: rgba(255,200,71,0.35); }
.vn-podium-block--silver { background: rgba(197,205,214,0.4); }
.vn-podium-block--bronze { background: rgba(205,147,82,0.3); }
.vn-podium-pos {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--vn-ink);
  opacity: 0.7;
}

/* ── MVP card ──────────────────────────────────────────────────────── */
.vn-mvp-card {
  background: var(--vn-grass);
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 2rem 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
}
.vn-mvp-trophy {
  flex-shrink: 0;
}
.vn-mvp-body { flex: 1; }
.vn-mvp-ribbon {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vn-ink);
  opacity: 0.75;
  margin-bottom: 0.4rem;
}
.vn-mvp-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  color: var(--vn-ink);
  line-height: 1.1;
  margin-bottom: 0.45rem;
}
.vn-mvp-detail {
  font-family: 'Lexend', sans-serif;
  font-size: 0.95rem;
  color: var(--vn-ink);
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}
.vn-mvp-detail strong { font-weight: 600; }

/* ── Team cards ────────────────────────────────────────────────────── */
.vn-squads-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .vn-squads-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .vn-squads-grid { grid-template-columns: repeat(3, 1fr); }
}
.vn-team-card {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 1.5rem;
}
.vn-team-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}
.vn-team-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1.15rem;
  line-height: 1.2;
  flex: 1;
}
.vn-captain-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'Lexend', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255,200,71,0.3);
  border: 1.5px solid var(--vn-gold);
  border-radius: 100px;
  padding: 0.15rem 0.5rem;
  color: var(--vn-ink);
  margin-top: 0.35rem;
  margin-left: 0.35rem;
}
.vn-team-pts {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 1.6rem;
  color: var(--vn-ink);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  flex-shrink: 0;
}
.vn-team-tour {
  font-family: 'Lexend', sans-serif;
  font-style: italic;
  font-size: 0.82rem;
  color: var(--vn-mute);
  margin-bottom: 0.85rem;
}
.vn-team-members {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.vn-avatar {
  display: inline-block;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1.5px var(--vn-ink);
}
.vn-av-grass  { background: var(--vn-grass); }
.vn-av-sky    { background: var(--vn-sky); }
.vn-av-sunset { background: var(--vn-sunset); }
.vn-av-plum   { background: var(--vn-plum); }
.vn-av-gold   { background: var(--vn-gold); }
.vn-avatar-more {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: var(--vn-mute);
  margin-left: 0.25rem;
}

/* ── Progress track ────────────────────────────────────────────────── */
.vn-progress-track {
  position: relative;
  height: 10px;
  background: var(--vn-paper-deep);
  border: 1.5px solid var(--vn-ink);
  border-radius: 100px;
  overflow: visible;
  margin-bottom: 0.3rem;
}
.vn-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--vn-grass);
  border-radius: 100px;
  transition: width 0.4s ease;
}
.vn-runner {
  position: absolute;
  top: -8px;
  pointer-events: none;
}
.vn-progress-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  color: var(--vn-mute);
  letter-spacing: 0.08em;
}

/* ── Queue grid ────────────────────────────────────────────────────── */
.vn-queue-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .vn-queue-grid { grid-template-columns: 1fr 1fr; }
}
.vn-queue-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.vn-queue-empty {
  font-family: 'Lexend', sans-serif;
  font-size: 0.85rem;
  color: var(--vn-mute);
  padding: 1.25rem;
  border: 2px dashed var(--vn-mute);
  border-radius: 14px;
  text-align: center;
  opacity: 0.7;
}

/* ── RSVP cards ────────────────────────────────────────────────────── */
.vn-rsvp-card {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 16px;
  box-shadow: 4px 4px 0 var(--vn-shadow);
  padding: 1.1rem 1.25rem;
}
.vn-rsvp-tag {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: rgba(255,200,71,0.35);
  border: 1.5px solid var(--vn-gold);
  border-radius: 100px;
  padding: 0.15rem 0.6rem;
  margin-bottom: 0.5rem;
}
.vn-rsvp-tag--plum {
  background: rgba(161,102,212,0.15);
  border-color: var(--vn-plum);
}
.vn-rsvp-team {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
}
.vn-rsvp-meta {
  font-family: 'Lexend', sans-serif;
  font-size: 0.82rem;
  color: var(--vn-mute);
  margin-bottom: 0.2rem;
}
.vn-rsvp-time {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: var(--vn-mute);
  margin-bottom: 0.75rem;
}
.vn-rsvp-actions { display: flex; gap: 0.5rem; }
.vn-btn {
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  border: 2px solid var(--vn-ink);
  border-radius: 100px;
  padding: 0.35rem 1rem;
  cursor: pointer;
  transition: box-shadow 80ms ease, transform 80ms ease;
}
.vn-btn:hover { box-shadow: 3px 3px 0 var(--vn-ink); transform: translate(-1px,-1px); }
.vn-btn--yes   { background: var(--vn-sunset); color: #ffffff; }
.vn-btn--maybe { background: var(--vn-paper-deep); color: var(--vn-ink); }

/* ── Pending + deadline cards ──────────────────────────────────────── */
.vn-pending-card,
.vn-deadline-card {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 16px;
  box-shadow: 4px 4px 0 var(--vn-shadow);
  padding: 1rem 1.25rem;
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}
.vn-deadline-card--urgent {
  border-color: #e53e3e;
  background: rgba(229,62,62,0.05);
}
.vn-whistle-svg, .vn-stopwatch-svg { flex-shrink: 0; margin-top: 2px; }
.vn-pending-body, .vn-deadline-body { flex: 1; }
.vn-pending-team, .vn-deadline-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.15rem;
}
.vn-pending-tour {
  font-family: 'Lexend', sans-serif;
  font-size: 0.8rem;
  color: var(--vn-mute);
  margin-bottom: 0.2rem;
}
.vn-pending-note, .vn-deadline-note {
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: var(--vn-mute);
}
.vn-deadline-note--urgent {
  color: #e53e3e;
  font-weight: 500;
}

/* ── Activity timeline ─────────────────────────────────────────────── */
.vn-timeline {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  position: relative;
}
.vn-timeline::before {
  content: '';
  position: absolute;
  top: 1.5rem;
  bottom: 1.5rem;
  left: 1.85rem;
  width: 0;
  border-left: 2px dashed rgba(42,31,26,0.2);
}
.vn-timeline-row {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: 0 0.75rem;
  padding: 0.6rem 0;
  position: relative;
}
.vn-timeline-dot {
  position: absolute;
  left: -1.65rem;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px var(--vn-ink);
}
.vn-dot--grass  { background: var(--vn-grass); }
.vn-dot--sky    { background: var(--vn-sky); }
.vn-dot--plum   { background: var(--vn-plum); }
.vn-dot--sunset { background: var(--vn-sunset); }
.vn-dot--mute   { background: var(--vn-mute); }
.vn-timeline-time {
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  color: var(--vn-mute);
  padding-top: 0.1rem;
  white-space: nowrap;
}
.vn-timeline-desc {
  font-family: 'Lexend', sans-serif;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--vn-ink);
}

/* ── Coach clipboard ───────────────────────────────────────────────── */
.vn-coach-card {
  background: var(--vn-paper-deep);
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 1.75rem;
}
.vn-coach-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .vn-coach-grid { grid-template-columns: repeat(4, 1fr); }
}
.vn-coach-stat {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 14px;
  box-shadow: 3px 3px 0 var(--vn-shadow);
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.vn-checkbox-svg { flex-shrink: 0; margin-top: 1px; }
.vn-coach-stat-body { flex: 1; }
.vn-coach-stat-label {
  font-family: 'Lexend', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--vn-mute);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.2rem;
}
.vn-coach-stat-value {
  font-family: 'DM Mono', monospace;
  font-size: 1.8rem;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.2rem;
}
.vn-coach-stat-unit { font-size: 1rem; margin-left: 0.05em; }
.vn-coach-stat-sub {
  font-family: 'Lexend', sans-serif;
  font-size: 0.72rem;
  color: var(--vn-mute);
}

/* ── Keyframe animations ───────────────────────────────────────────── */
@keyframes vn-fadein-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes vn-bar-grow {
  from { width: 0 !important; }
  to   { /* final width set inline */ }
}
@keyframes vn-ribbon-flutter {
  0%, 100% { letter-spacing: 0.14em; }
  50%       { letter-spacing: 0.18em; }
}
@keyframes vn-confetti-drift {
  0%   { transform: translateY(0) rotate(0deg); }
  50%  { transform: translateY(-6px) rotate(10deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

.vn-section--fadein {
  animation: vn-fadein-up 0.4s ease both;
}
.vn-bar-fill--anim {
  animation: vn-bar-grow 0.5s ease both;
}
.vn-ribbon:hover .vn-ribbon-label {
  animation: vn-ribbon-flutter 0.4s ease;
}
.vn-confetti-1 { animation: vn-confetti-drift 4s ease-in-out infinite; }
.vn-confetti-2 { animation: vn-confetti-drift 5s ease-in-out 0.5s infinite; }
.vn-confetti-3 { animation: vn-confetti-drift 3.5s ease-in-out 1s infinite; }

@media (prefers-reduced-motion: reduce) {
  .vn-section--fadein,
  .vn-bar-fill--anim,
  .vn-confetti-1,
  .vn-confetti-2,
  .vn-confetti-3 {
    animation: none;
  }
}

/* hover lift on team + metric cards */
.vn-team-card:hover,
.vn-metric-tile:hover,
.vn-rosette-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--vn-shadow);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

/* ── Metric tiles ──────────────────────────────────────────────────── */
.vn-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}
@media (min-width: 640px) {
  .vn-metrics-grid { grid-template-columns: repeat(4, 1fr); }
}
.vn-metric-tile {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 16px;
  box-shadow: 5px 5px 0 var(--vn-shadow);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  overflow: hidden;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.vn-metric-accent-rule {
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--vn-metric-accent, var(--vn-gold)) 0px,
    var(--vn-metric-accent, var(--vn-gold)) 8px,
    transparent 8px,
    transparent 14px
  );
  border-radius: 2px;
  margin-bottom: 0.6rem;
  margin-top: -0.25rem;
  margin-left: -1rem;
  margin-right: -1rem;
}
.vn-metric-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--vn-mute);
}
.vn-metric-value {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 2.4rem;
  line-height: 1;
  color: var(--vn-ink);
  font-variant-numeric: tabular-nums;
}
.vn-metric-unit {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vn-mute);
  margin-bottom: 0.4rem;
}
.vn-metric-sparkline { margin-top: auto; }

/* ── Rival / Tale of the Tape ──────────────────────────────────────── */
.vn-rival-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
}
@media (max-width: 639px) {
  .vn-rival-wrap { flex-direction: column; }
}
.vn-rosette-card {
  flex: 1;
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.vn-rosette-card--highlight {
  background: rgba(255,200,71,0.15);
  border-color: var(--vn-gold);
}
.vn-rosette-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vn-mute);
  margin-bottom: 0.35rem;
}
.vn-rosette-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1.3rem;
  line-height: 1.2;
  color: var(--vn-ink);
  margin-bottom: 0.35rem;
}
.vn-rosette-pts {
  font-family: 'DM Mono', monospace;
  font-size: 2rem;
  font-weight: 500;
  color: var(--vn-ink);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.vn-rosette-pts-unit {
  font-size: 0.9rem;
  color: var(--vn-mute);
}
.vn-rosette-meta {
  font-family: 'Lexend', sans-serif;
  font-size: 0.78rem;
  color: var(--vn-mute);
  margin-top: 0.25rem;
}
.vn-rival-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  position: relative;
}
.vn-rival-vs-label {
  position: absolute;
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--vn-ink);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.vn-rival-delta {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 100px;
  padding: 0.2rem 0.6rem;
  border: 1.5px solid var(--vn-ink);
}
.vn-rival-delta--ahead { background: rgba(93,199,122,0.25); }
.vn-rival-delta--behind { background: rgba(255,122,69,0.2); }

/* ── Full standings table ──────────────────────────────────────────── */
.vn-standings-wrap {
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--vn-shadow);
  overflow: hidden;
}
.vn-candy-rule {
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    var(--vn-sunset) 0px,
    var(--vn-sunset) 12px,
    var(--vn-gold) 12px,
    var(--vn-gold) 24px,
    var(--vn-grass) 24px,
    var(--vn-grass) 36px,
    var(--vn-sky) 36px,
    var(--vn-sky) 48px
  );
}
.vn-standings-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Lexend', sans-serif;
  font-size: 0.85rem;
}
.vn-th {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--vn-mute);
  padding: 0.6rem 0.85rem;
  text-align: left;
  background: var(--vn-paper-deep);
  border-bottom: 2px solid var(--vn-ink);
}
.vn-tr {
  border-bottom: 1.5px solid rgba(42,31,26,0.1);
  transition: background 80ms ease;
}
.vn-tr:hover { background: var(--vn-paper-deep); }
.vn-tr--top { background: rgba(255,200,71,0.06); }
.vn-td {
  padding: 0.65rem 0.85rem;
  vertical-align: middle;
}
.vn-td-rank {
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
}
.vn-td-team {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
}
.vn-td-team-name { margin-right: 0.35rem; }
.vn-td-tour {
  font-family: 'Lexend', sans-serif;
  font-size: 0.8rem;
  color: var(--vn-mute);
  font-style: italic;
}
.vn-td-num {
  font-family: 'DM Mono', monospace;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--vn-mute);
  text-align: center;
}
.vn-role-badge {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(93,185,245,0.2);
  border: 1.5px solid var(--vn-sky);
  border-radius: 100px;
  padding: 0.1rem 0.5rem;
}
.vn-td-bar { min-width: 10rem; }
.vn-bar {
  position: relative;
  height: 20px;
  background: var(--vn-paper-deep);
  border: 1.5px solid var(--vn-ink);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.vn-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--vn-grass), var(--vn-sky));
  border-radius: 4px 0 0 4px;
  transition: width 0.5s ease;
}
.vn-bar-num {
  position: relative;
  z-index: 1;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--vn-ink);
  padding-left: 0.5rem;
  font-variant-numeric: tabular-nums;
}

/* ── Starting lineup ───────────────────────────────────────────────── */
.vn-lineup-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.vn-lineup-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #ffffff;
  border: 2px solid var(--vn-ink);
  border-radius: 14px;
  box-shadow: 4px 4px 0 var(--vn-shadow);
  padding: 0.75rem 1rem;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.vn-lineup-row:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--vn-shadow);
}
.vn-lineup-num { flex-shrink: 0; }
.vn-lineup-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.vn-lineup-name {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.2;
}
.vn-lineup-tour {
  font-family: 'Lexend', sans-serif;
  font-size: 0.75rem;
  color: var(--vn-mute);
  font-style: italic;
}
.vn-lineup-role {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(93,185,245,0.2);
  border: 1.5px solid var(--vn-sky);
  border-radius: 100px;
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.vn-lineup-role--captain {
  background: rgba(255,200,71,0.3);
  border-color: var(--vn-gold);
}
.vn-lineup-pts {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 1.3rem;
  color: var(--vn-ink);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.vn-lineup-pts-unit {
  font-size: 0.65rem;
  color: var(--vn-mute);
  margin-left: 0.1rem;
}
.vn-lineup-members {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}

/* ── Footer ribbon ─────────────────────────────────────────────────── */
.vn-footer { margin-top: 2.5rem; display: flex; justify-content: center; }
.vn-footer-ribbon {
  display: flex;
  align-items: stretch;
  color: var(--vn-ink);
  background: var(--vn-sunset);
  min-height: 2.5rem;
}
.vn-footer-tail {
  display: block;
  color: var(--vn-sunset);
  flex-shrink: 0;
  height: 2.5rem;
}
.vn-footer-tail--left  { margin-left: -1px; }
.vn-footer-tail--right { margin-right: -1px; }
.vn-footer-label {
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
