"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

/**
 * Variant M — Stride (Fitness-Tracker Aesthetic)
 *
 * Premium fitness-tracker app energy: Apple Fitness / Whoop / Strava / Oura.
 * Dark slate background (#08090d), bold electric-lime and cyan accents.
 * Concentric activity rings as the focal point, big tabular metrics,
 * streak indicators, micro-sparklines, achievement badges.
 */
export function DashboardVariantM({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  // Derive approved submissions count from activities
  const approvedActivities = data.activities.filter(
    (a) => a.type === "submission_approved",
  );
  const todayApproved = approvedActivities.filter((a) => {
    const d = new Date(a.timestamp).toISOString().slice(0, 10);
    return d === today;
  }).length;

  // Derive streak: count unique days in the last 7 days that have any activity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - i * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const activeDays = new Set(
    data.activities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = last7Days.filter((d) => activeDays.has(d)).length;

  // Weekly approved activities
  const weekStart = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekApproved = approvedActivities.filter((a) => {
    const d = new Date(a.timestamp).toISOString().slice(0, 10);
    return d >= weekStart;
  }).length;

  // Active teams for rings
  const activeTeams = data.teams.filter(
    (t) => t.tournament.startDate <= today && t.tournament.endDate >= today,
  );

  // Best squad rank heuristic: team with highest points among active
  const topTeam =
    activeTeams.length > 0
      ? activeTeams.reduce((best, t) =>
          t.team.points > best.team.points ? t : best,
        )
      : (data.teams[0] ?? null);

  // Squad rank: count how many teams in same tournament have more points
  const squadRank = topTeam
    ? data.teams.filter(
        (t) =>
          t.tournament._id === topTeam.tournament._id &&
          t.team.points > topTeam.team.points,
      ).length + 1
    : 1;
  const squadTotal = data.teams.filter(
    (t) => topTeam && t.tournament._id === topTeam.tournament._id,
  ).length;

  // Ring fill ratios (0–1)
  const activityTarget = 5;
  const activityRatio = Math.min(todayApproved / activityTarget, 1);
  const streakRatio = Math.min(streakDays / 7, 1);
  const squadProgress =
    activeTeams.length > 0 && topTeam
      ? tournamentProgress(topTeam.tournament)
      : 0;

  // Sparkline data (last 7 days approved activity count per day)
  const sparkline = last7Days
    .slice()
    .reverse()
    .map(
      (d) =>
        approvedActivities.filter(
          (a) => new Date(a.timestamp).toISOString().slice(0, 10) === d,
        ).length,
    );

  // Achievements
  const achievements = buildAchievements(data, streakDays);

  // Captain teams
  const captainTeams = data.teams.filter((t) => t.userRole === "captain");

  // League standings: sorted by points desc
  const sortedTeams = [...data.teams].sort(
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

  // Top rival (Tale of the Tape)
  const userTop = sortedTeams[0] ?? null;
  const rival = sortedTeams[1] ?? null;

  // Avg daily activities (last 7 days)
  const avgDaily =
    sparkline.reduce((s, v) => s + v, 0) / Math.max(sparkline.length, 1);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <VariantMStyles />
      <div className="variant-m">
        {/* Grain overlay */}
        <div className="vm-grain" aria-hidden />

        {/* 1. Top bar */}
        <header className="vm-topbar">
          <div className="vm-wordmark">
            <span className="vm-wordmark-text">STRIDE</span>
            <span className="vm-wordmark-sep">·</span>
            <span className="vm-wordmark-year">2026</span>
          </div>
          <span className="vm-topbar-date">{dateLabel}</span>
        </header>

        {/* 2. Hero — Activity Rings */}
        <section className="vm-hero-card vm-card">
          <div className="vm-hero-left">
            <p className="vm-greeting">Hi, {data.userName}</p>
            <p className="vm-hero-sub">Your daily readout</p>
            <ActivityRings
              activityRatio={activityRatio}
              streakRatio={streakRatio}
              squadProgress={squadProgress}
              todayApproved={todayApproved}
            />
          </div>
          <div className="vm-hero-right">
            <HeroStat
              label="ACTIVITIES TODAY"
              accent="lime"
              today={todayApproved}
              avg={parseFloat(avgDaily.toFixed(1))}
              unit=""
            />
            <HeroStat
              label="STREAK"
              accent="cyan"
              today={streakDays}
              avg={5}
              unit=" days"
            />
            <HeroStat
              label="SQUAD PROGRESS"
              accent="magenta"
              today={Math.round(squadProgress * 100)}
              avg={60}
              unit="%"
            />
          </div>
        </section>

        {/* 3. Vital metrics strip */}
        <div className="vm-metrics-strip">
          <MetricCard
            label="STREAK"
            value={streakDays}
            unit="DAYS"
            accent="cyan"
            sparkline={last7Days
              .slice()
              .reverse()
              .map((d) => (activeDays.has(d) ? 1 : 0))}
          />
          <MetricCard
            label="ACTIVITIES TODAY"
            value={todayApproved}
            unit="LOGGED"
            accent="lime"
            sparkline={sparkline}
          />
          <MetricCard
            label="ACTIVITIES THIS WK"
            value={weekApproved}
            unit="THIS WEEK"
            accent="lime"
            sparkline={sparkline}
          />
          <MetricCard
            label="RANK"
            value={squadRank}
            unit={`OF ${Math.max(squadTotal, 1)} IN SQUAD`}
            accent="magenta"
            sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
          />
        </div>

        {/* 4. Squad standings */}
        <section className="vm-card vm-squads-card">
          <div className="vm-section-header">
            <span className="vm-section-label">MY SQUADS</span>
            <span className="vm-section-meta">
              {data.teams.length} challenge{data.teams.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="vm-squads-list">
            {data.teams.map((t) => (
              <SquadRow key={t.team._id} team={t} />
            ))}
            {data.teams.length === 0 && (
              <p className="vm-empty">
                No squads yet. Join a challenge to get started.
              </p>
            )}
          </div>
        </section>

        {/* 5. Achievements row */}
        {achievements.length > 0 && (
          <div className="vm-achievements">
            <span className="vm-achievements-label">BADGES</span>
            <div className="vm-achievements-chips">
              {achievements.map((a) => (
                <AchievementChip
                  key={a.key}
                  label={a.label}
                  accent={a.accent}
                  icon={a.icon}
                />
              ))}
            </div>
          </div>
        )}

        {/* 6. Inbox & Queue */}
        <section className="vm-card vm-inbox-card">
          <div className="vm-inbox-col">
            <div className="vm-section-header">
              <span className="vm-section-label">INVITATIONS & REQUESTS</span>
            </div>
            {data.invitations.length === 0 &&
              data.joinRequests.length === 0 && (
                <p className="vm-empty">Inbox is clear.</p>
              )}
            {data.invitations.map((inv) => (
              <InboxRow
                key={inv.id}
                title={inv.teamName}
                meta={`${inv.invitedBy} · ${inv.tournamentName}`}
                time={formatRelative(inv.timestamp)}
                kind="INVITATION"
                accentColor="lime"
              />
            ))}
            {data.joinRequests.map((jr) => (
              <InboxRow
                key={jr.id}
                title={jr.userName}
                meta={`wants to join ${jr.teamName}`}
                time={formatRelative(jr.timestamp)}
                kind="JOIN REQ"
                accentColor="cyan"
              />
            ))}
          </div>
          <div className="vm-inbox-divider" aria-hidden />
          <div className="vm-inbox-col">
            <div className="vm-section-header">
              <span className="vm-section-label">PENDING & DEADLINES</span>
            </div>
            {data.pendingSubmissions.length === 0 &&
              data.deadlines.length === 0 && (
                <p className="vm-empty">All clear.</p>
              )}
            {data.pendingSubmissions.map((s) => (
              <QueueRow
                key={s.id}
                title={s.teamName}
                meta={`${s.tournamentName} · ${s.date}`}
                status="awaiting review"
                urgent={false}
              />
            ))}
            {data.deadlines.map((d) => (
              <QueueRow
                key={d.tournament._id}
                title={d.tournament.name}
                meta={`challenge closes in ${d.daysUntilEnd} day${d.daysUntilEnd !== 1 ? "s" : ""}`}
                status={`${d.daysUntilEnd}d`}
                urgent={d.daysUntilEnd <= 3}
              />
            ))}
          </div>
        </section>

        {/* 7. Activity log */}
        <section className="vm-card vm-log-card">
          <div className="vm-section-header">
            <span className="vm-section-label">ACTIVITY HISTORY</span>
          </div>
          <ol className="vm-log-list">
            {data.activities.map((a, i) => (
              <li key={i} className="vm-log-row">
                <span className="vm-log-time">
                  {formatRelative(a.timestamp)}
                </span>
                <span
                  className={`vm-log-dot vm-log-dot--${activityDotColor(a.type)}`}
                  aria-hidden
                />
                <span className="vm-log-desc">{a.description}</span>
              </li>
            ))}
            {data.activities.length === 0 && (
              <li className="vm-empty">No activity yet.</li>
            )}
          </ol>
        </section>

        {/* 8. Admin — Captain's deck */}
        {data.isAdmin && data.adminStats && (
          <section className="vm-card vm-captains-deck">
            <div className="vm-section-header">
              <span className="vm-section-label">CAPTAIN&apos;S DECK</span>
              <span className="vm-section-meta vm-admin-badge">ADMIN</span>
            </div>
            <div className="vm-gauges">
              <GaugeTile
                label="MEMBERS"
                value={data.adminStats.users.total}
                max={300}
                accent="cyan"
                sub={`+${data.adminStats.users.newThisWeek} this week`}
              />
              <GaugeTile
                label="ACTIVE CHALLENGES"
                value={data.adminStats.tournaments.active}
                max={data.adminStats.tournaments.total}
                accent="lime"
                sub={`${data.adminStats.tournaments.upcoming} upcoming`}
              />
              <GaugeTile
                label="REVIEW QUEUE"
                value={data.adminStats.submissions.pending}
                max={Math.max(data.adminStats.submissions.total, 1)}
                accent="amber"
                sub="pending submissions"
              />
              <GaugeTile
                label="APPROVAL %"
                value={Math.round(
                  (data.adminStats.submissions.approved /
                    Math.max(
                      data.adminStats.submissions.approved +
                        data.adminStats.submissions.rejected,
                      1,
                    )) *
                    100,
                )}
                max={100}
                accent="magenta"
                sub={`${data.adminStats.submissions.approved} approved`}
              />
            </div>
          </section>
        )}

        {/* Captain teams quick view when not admin */}
        {!data.isAdmin && captainTeams.length > 0 && (
          <section className="vm-card vm-captain-card">
            <div className="vm-section-header">
              <span className="vm-section-label">CAPTAINING</span>
              <span className="vm-section-meta">
                {captainTeams.length} squad
                {captainTeams.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="vm-captain-list">
              {captainTeams.map((t) => (
                <div key={t.team._id} className="vm-captain-row">
                  <CrownIcon />
                  <span className="vm-captain-name">{t.team.name}</span>
                  <span className="vm-captain-tour">{t.tournament.name}</span>
                  <span className="vm-captain-pts">{t.team.points} pts</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. League Standings */}
        {sortedTeams.length > 0 && (
          <section className="vm-card vm-standings-card">
            <div className="vm-section-header">
              <span className="vm-section-label">LEAGUE STANDINGS</span>
              <span className="vm-section-meta">
                {sortedTeams.length} squads
              </span>
            </div>
            <div className="vm-standings-table">
              {sortedTeams.map((t, i) => {
                const isCaptain = t.userRole === "captain";
                const fillPct = (t.team.points / maxPts) * 100;
                const rank = String(i + 1).padStart(2, "0");
                return (
                  <div key={t.team._id} className="vm-standings-row">
                    <span className="vm-standings-rank">{rank}</span>
                    <div className="vm-standings-team">
                      {isCaptain && <CrownIcon />}
                      <span className="vm-standings-name">{t.team.name}</span>
                    </div>
                    <span className="vm-standings-tour">
                      {t.tournament.name}
                    </span>
                    <span
                      className={`vm-standings-role vm-standings-role--${isCaptain ? "captain" : "member"}`}
                    >
                      {isCaptain ? "CPT" : "MBR"}
                    </span>
                    <span className="vm-standings-members">
                      {t.memberCount}M
                    </span>
                    <div className="vm-standings-bar-wrap">
                      <div
                        className="vm-standings-bar-fill"
                        style={{ width: `${fillPct}%` }}
                      />
                      <span className="vm-standings-pts">{t.team.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 10. Team of the Day */}
        {mvpTeam ? (
          <section className="vm-card vm-mvp-card">
            <div className="vm-mvp-inner">
              <div className="vm-mvp-trophy" aria-hidden>
                <TrophySvg />
              </div>
              <div className="vm-mvp-body">
                <span className="vm-mvp-eyebrow">TOP CREW</span>
                <div className="vm-mvp-name">{mvpTeam.team.name}</div>
                <p
                  className="vm-mvp-detail vm-mono"
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {mvpTeam.tournament.name}
                </p>
                <p className="vm-mvp-detail">
                  {mvpDisplayCount} submission{mvpDisplayCount === 1 ? "" : "s"}{" "}
                  {mvpCountToday > 0 ? "today" : "this period"} &middot;{" "}
                  {mvpTeam.memberCount} member
                  {mvpTeam.memberCount === 1 ? "" : "s"}
                  {mvpTeam.userRole === "captain" && (
                    <>
                      {" "}
                      &middot; <strong>captain</strong>
                    </>
                  )}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* 11. Top Rival — Tale of the Tape */}
        {userTop && rival && (
          <section className="vm-card vm-tape-card">
            <div className="vm-section-header">
              <span className="vm-section-label">TALE OF THE TAPE</span>
            </div>
            <div className="vm-tape-grid">
              <TapeColumn team={userTop} side="left" label="YOU" />
              <div className="vm-tape-delta">
                {userTop.team.points >= rival.team.points ? (
                  <>
                    <span className="vm-tape-delta-label vm-tape-delta--ahead">
                      AHEAD BY
                    </span>
                    <span className="vm-tape-delta-num vm-tape-delta--ahead">
                      {userTop.team.points - rival.team.points}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="vm-tape-delta-label vm-tape-delta--behind">
                      BEHIND BY
                    </span>
                    <span className="vm-tape-delta-num vm-tape-delta--behind">
                      {rival.team.points - userTop.team.points}
                    </span>
                  </>
                )}
                <span className="vm-tape-delta-unit">pts</span>
              </div>
              <TapeColumn team={rival} side="right" label="RIVAL" />
            </div>
          </section>
        )}

        {/* 12. Today's Lineup */}
        {data.teams.length > 0 && (
          <section className="vm-card vm-lineup-card">
            <div className="vm-section-header">
              <span className="vm-section-label">TODAY&apos;S LINEUP</span>
              <span className="vm-section-meta">
                {data.teams.length} squad{data.teams.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="vm-lineup-list">
              {data.teams.map((t, i) => {
                const isCaptain = t.userRole === "captain";
                return (
                  <div key={t.team._id} className="vm-lineup-row">
                    <span className="vm-lineup-num">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="vm-lineup-name">{t.team.name}</span>
                    <span
                      className={`vm-lineup-role vm-lineup-role--${isCaptain ? "captain" : "member"}`}
                    >
                      {isCaptain ? "CAPTAIN" : "MEMBER"}
                    </span>
                    <span className="vm-lineup-pts">{t.team.points} pts</span>
                    <span className="vm-lineup-members">
                      {t.memberCount} mbr
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 13. Footer */}
        <footer className="vm-footer">
          <span>STRIDE · TRAINED ON FRIENDLY COMPETITION · {today}</span>
        </footer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tournamentProgress(t: { startDate: string; endDate: string }) {
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

function activityDotColor(type: string): string {
  if (type === "submission_approved") return "lime";
  if (type === "submission_rejected") return "red";
  if (type === "team_member_joined") return "cyan";
  return "magenta";
}

type Achievement = {
  key: string;
  label: string;
  accent: "lime" | "cyan" | "magenta" | "amber";
  icon: "flame" | "crown" | "bolt" | "check" | "star";
};

function buildAchievements(
  data: DashboardFixtureData,
  streakDays: number,
): Achievement[] {
  const list: Achievement[] = [];
  if (streakDays >= 5) {
    list.push({
      key: "streak",
      label: `${streakDays}-DAY STREAK`,
      accent: "cyan",
      icon: "flame",
    });
  }
  const captainCount = data.teams.filter(
    (t) => t.userRole === "captain",
  ).length;
  if (captainCount > 0) {
    list.push({
      key: "captain",
      label: "FIRST CAPTAIN",
      accent: "amber",
      icon: "crown",
    });
  }
  const totalPoints = data.teams.reduce((s, t) => s + t.team.points, 0);
  if (totalPoints >= 100) {
    list.push({
      key: "century",
      label: "100 PTS CLUB",
      accent: "lime",
      icon: "bolt",
    });
  }
  if (data.pendingSubmissionsCount > 0) {
    list.push({
      key: "ready",
      label: "READY TO LOG",
      accent: "magenta",
      icon: "star",
    });
  }
  if (data.activeTournamentsCount > 0) {
    list.push({
      key: "active",
      label: "ACTIVE CHALLENGER",
      accent: "lime",
      icon: "check",
    });
  }
  return list;
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ActivityRings({
  activityRatio,
  streakRatio,
  squadProgress,
  todayApproved,
}: {
  activityRatio: number;
  streakRatio: number;
  squadProgress: number;
  todayApproved: number;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;

  const rings = [
    {
      r: 88,
      ratio: activityRatio,
      color: "#caff33",
      label: "ACTIVITIES",
      strokeWidth: 10,
    },
    {
      r: 68,
      ratio: streakRatio,
      color: "#00e5ff",
      label: "STREAK",
      strokeWidth: 10,
    },
    {
      r: 48,
      ratio: squadProgress,
      color: "#ff5a8a",
      label: "SQUAD",
      strokeWidth: 10,
    },
  ];

  return (
    <svg
      className="vm-rings-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Activity rings"
    >
      <defs>
        {rings.map((ring) => (
          <filter
            key={`glow-${ring.label}`}
            id={`vm-glow-${ring.label}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
      {rings.map((ring) => {
        const circ = 2 * Math.PI * ring.r;
        const filled = circ * ring.ratio;
        const gap = circ - filled;
        return (
          <g key={ring.label}>
            {/* Track */}
            <circle
              cx={cx}
              cy={cy}
              r={ring.r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={ring.strokeWidth}
            />
            {/* Fill arc */}
            {ring.ratio > 0 && (
              <circle
                cx={cx}
                cy={cy}
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${gap}`}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ filter: `drop-shadow(0 0 8px ${ring.color})` }}
              />
            )}
          </g>
        );
      })}
      {/* Center label */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="rgba(244,245,248,0.55)"
        fontFamily="'DM Mono', monospace"
        fontSize="9"
        letterSpacing="2"
      >
        ACTIVITIES
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fill="#f4f5f8"
        fontFamily="'Sora', sans-serif"
        fontWeight="700"
        fontSize="28"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {todayApproved}
      </text>
      <text
        x={cx}
        y={cy + 32}
        textAnchor="middle"
        fill="rgba(244,245,248,0.55)"
        fontFamily="'DM Mono', monospace"
        fontSize="8"
        letterSpacing="1.5"
      >
        TODAY
      </text>
    </svg>
  );
}

function RingLegend() {
  return (
    <div className="vm-ring-legend">
      <LegendItem color="#caff33" label="ACTIVITIES" />
      <LegendItem color="#00e5ff" label="STREAK" />
      <LegendItem color="#ff5a8a" label="SQUAD" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="vm-legend-item">
      <span
        className="vm-legend-dot"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="vm-legend-label">{label}</span>
    </div>
  );
}

function HeroStat({
  label,
  accent,
  today,
  avg,
  unit,
}: {
  label: string;
  accent: "lime" | "cyan" | "magenta";
  today: number;
  avg: number;
  unit: string;
}) {
  const isUp = today >= avg;
  return (
    <div className={`vm-hero-stat vm-hero-stat--${accent}`}>
      <span className="vm-hero-stat-label">{label}</span>
      <div className="vm-hero-stat-values">
        <span className="vm-hero-stat-today">
          {today}
          {unit}
        </span>
        <span className="vm-hero-stat-avg">
          <span className="vm-hero-stat-arrow">{isUp ? "▲" : "▼"}</span>
          avg {avg}
          {unit}
        </span>
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 56;
  const h = 24;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      className="vm-sparkline"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  unit,
  accent,
  sparkline,
}: {
  label: string;
  value: number;
  unit: string;
  accent: "lime" | "cyan" | "magenta";
  sparkline: number[];
}) {
  const accentColors = {
    lime: "#caff33",
    cyan: "#00e5ff",
    magenta: "#ff5a8a",
  };
  const color = accentColors[accent];
  return (
    <div className={`vm-metric-card vm-card vm-metric-card--${accent}`}>
      <span className="vm-metric-label">{label}</span>
      <span className="vm-metric-value" style={{ color: "#f4f5f8" }}>
        {value}
      </span>
      <span className="vm-metric-unit">{unit}</span>
      <Sparkline values={sparkline} color={color} />
    </div>
  );
}

type DemoTeamItem = DashboardFixtureData["teams"][number];

function SquadRow({ team }: { team: DemoTeamItem }) {
  const progress = Math.max(
    0,
    Math.min(1, tournamentProgress(team.tournament)),
  );
  const isCaptain = team.userRole === "captain";
  const initials = team.team.name.slice(0, 1).toUpperCase();

  return (
    <div className="vm-squad-row">
      <div className="vm-squad-avatar">{initials}</div>
      <div className="vm-squad-info">
        <div className="vm-squad-name">
          {isCaptain && <CrownIcon />}
          <span>{team.team.name}</span>
        </div>
        <span className="vm-squad-tour">{team.tournament.name}</span>
      </div>
      <div className="vm-squad-track-wrap">
        <div className="vm-squad-track">
          <div
            className="vm-squad-fill"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="vm-squad-tip"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <span className="vm-squad-pct">{Math.round(progress * 100)}%</span>
      </div>
      <div className="vm-squad-right">
        <span className="vm-squad-pts">{team.team.points}</span>
        <span className="vm-squad-pts-label">pts</span>
        <span
          className={`vm-squad-role vm-squad-role--${isCaptain ? "captain" : "member"}`}
        >
          {isCaptain ? "CAPTAIN" : "MEMBER"}
        </span>
      </div>
    </div>
  );
}

function AchievementChip({
  label,
  accent,
  icon,
}: {
  label: string;
  accent: "lime" | "cyan" | "magenta" | "amber";
  icon: "flame" | "crown" | "bolt" | "check" | "star";
}) {
  return (
    <div className={`vm-chip vm-chip--${accent}`}>
      <ChipIcon icon={icon} />
      <span>{label}</span>
    </div>
  );
}

function ChipIcon({ icon }: { icon: string }) {
  if (icon === "flame") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M6 1C6 1 8.5 3.5 8.5 6C8.5 7.38 7.38 8.5 6 8.5C4.62 8.5 3.5 7.38 3.5 6C3.5 5 4 4 4 4C4 4 4.5 5.5 5.5 5.5C5.5 4.5 5.5 2.5 6 1Z"
          fill="currentColor"
        />
        <circle cx="6" cy="9.5" r="1" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  if (icon === "crown") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M1 9h10l-1-5L7 7 6 4 5 7 2 4 1 9Z" fill="currentColor" />
        <rect
          x="1"
          y="9.5"
          width="10"
          height="1"
          rx="0.5"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (icon === "bolt") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M7 1L3 7h3.5L5 11 9 5H5.5L7 1Z" fill="currentColor" />
      </svg>
    );
  }
  if (icon === "check") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2 6L5 9 10 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // star
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 1.5l1.1 2.3 2.5.35-1.8 1.75.43 2.5L6 7.15 3.77 8.4l.43-2.5-1.8-1.75 2.5-.35L6 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg
      width="13"
      height="11"
      viewBox="0 0 13 11"
      fill="none"
      className="vm-crown"
      aria-hidden
    >
      <path d="M1 10h11L10.5 4 8 7 6.5 3 5 7 2.5 4 1 10Z" fill="#ffc847" />
      <rect x="1" y="10" width="11" height="1" rx="0.5" fill="#ffc847" />
    </svg>
  );
}

function InboxRow({
  title,
  meta,
  time,
  kind,
  accentColor,
}: {
  title: string;
  meta: string;
  time: string;
  kind: string;
  accentColor: "lime" | "cyan";
}) {
  return (
    <div className={`vm-inbox-row vm-inbox-row--${accentColor}`}>
      <div className="vm-inbox-row-head">
        <span className="vm-inbox-kind">{kind}</span>
        <span className="vm-inbox-time">{time}</span>
      </div>
      <div className="vm-inbox-title">{title}</div>
      <div className="vm-inbox-meta">{meta}</div>
      <div className="vm-inbox-actions">
        <button className="vm-action-btn vm-action-btn--primary">
          {kind === "INVITATION" ? "LET'S GO" : "WELCOME"}
        </button>
        <button className="vm-action-btn vm-action-btn--outline">
          {kind === "INVITATION" ? "MAYBE LATER" : "PASS"}
        </button>
      </div>
    </div>
  );
}

function QueueRow({
  title,
  meta,
  status,
  urgent,
}: {
  title: string;
  meta: string;
  status: string;
  urgent: boolean;
}) {
  return (
    <div className="vm-queue-row">
      <div className="vm-queue-info">
        <span className="vm-queue-title">{title}</span>
        <span className="vm-queue-meta">{meta}</span>
      </div>
      <span
        className={`vm-queue-status ${urgent ? "vm-queue-status--urgent" : ""}`}
      >
        {status}
      </span>
    </div>
  );
}

function GaugeTile({
  label,
  value,
  max,
  accent,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  accent: "lime" | "cyan" | "amber" | "magenta";
  sub: string;
}) {
  const ratio = Math.min(value / Math.max(max, 1), 1);
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = circ * ratio * 0.75; // 270 deg arc
  const gap = circ - filled;
  const accentColors: Record<string, string> = {
    lime: "#caff33",
    cyan: "#00e5ff",
    amber: "#ffc847",
    magenta: "#ff5a8a",
  };
  const color = accentColors[accent] ?? "#caff33";

  return (
    <div className={`vm-gauge-tile vm-gauge-tile--${accent}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="vm-gauge-svg"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={7}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {ratio > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            transform={`rotate(135 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#f4f5f8"
          fontFamily="'Sora', sans-serif"
          fontWeight="700"
          fontSize="14"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </text>
      </svg>
      <span className="vm-gauge-label">{label}</span>
      <span className="vm-gauge-sub">{sub}</span>
    </div>
  );
}

function TrophySvg() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M12 6h16v14c0 5.52-3.58 10-8 10s-8-4.48-8-10V6Z"
        fill="rgba(202,255,51,0.15)"
        stroke="#caff33"
        strokeWidth="1.5"
      />
      <path
        d="M6 8h6v8c0 2.21-1.34 4-3 4S6 18.21 6 16V8ZM34 8h-6v8c0 2.21 1.34 4 3 4s3-1.79 3-4V8Z"
        fill="rgba(202,255,51,0.08)"
        stroke="#caff33"
        strokeWidth="1"
      />
      <rect x="16" y="30" width="8" height="2" rx="1" fill="#caff33" />
      <rect x="13" y="32" width="14" height="2.5" rx="1.25" fill="#caff33" />
      <path
        d="M17 16l1.5 3 3.5.5-2.5 2.5.6 3.5L20 24l-2.6 1.5.6-3.5L15.5 19.5l3.5-.5L17 16Z"
        fill="#caff33"
        opacity="0.8"
      />
    </svg>
  );
}

function TapeColumn({
  team,
  side,
  label,
}: {
  team: DemoTeamItem;
  side: "left" | "right";
  label: string;
}) {
  const isCaptain = team.userRole === "captain";
  const progress = Math.max(
    0,
    Math.min(1, tournamentProgress(team.tournament)),
  );
  return (
    <div className={`vm-tape-col vm-tape-col--${side}`}>
      <span className="vm-tape-col-label">{label}</span>
      <span className="vm-tape-team-name">{team.team.name}</span>
      {isCaptain && (
        <span className="vm-tape-captain">
          <CrownIcon /> CAPTAIN
        </span>
      )}
      <div className="vm-tape-stat">
        <span className="vm-tape-stat-num">{team.memberCount}</span>
        <span className="vm-tape-stat-lbl">members</span>
      </div>
      <div className="vm-tape-stat">
        <span className="vm-tape-stat-num vm-tape-stat-num--pts">
          {team.team.points}
        </span>
        <span className="vm-tape-stat-lbl">points</span>
      </div>
      <div className="vm-tape-progress">
        <span className="vm-tape-stat-lbl">
          {Math.round(progress * 100)}% tournament
        </span>
        <div className="vm-tape-prog-track">
          <div
            className="vm-tape-prog-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function VariantMStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;500;700&family=DM+Mono:wght@400;500&display=swap');

        .variant-m {
          --vm-bg: #08090d;
          --vm-bg2: #11131a;
          --vm-surface: #171a23;
          --vm-surface2: #1d212c;
          --vm-hairline: rgba(255,255,255,0.07);
          --vm-text: #f4f5f8;
          --vm-mute: rgba(244,245,248,0.55);
          --vm-lime: #caff33;
          --vm-cyan: #00e5ff;
          --vm-magenta: #ff5a8a;
          --vm-amber: #ffc847;
          --vm-red: #ff5658;

          position: relative;
          overflow: hidden;
          background: var(--vm-bg);
          font-family: 'Sora', sans-serif;
          font-weight: 300;
          color: var(--vm-text);
          font-variant-numeric: tabular-nums;
          padding: 0 0 2rem;
          border-radius: 18px;
        }

        /* Grain texture */
        .vm-grain {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        /* Everything sits above grain */
        .variant-m > *:not(.vm-grain) {
          position: relative;
          z-index: 1;
        }

        /* Top bar */
        .vm-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.75rem;
          border-bottom: 1px solid var(--vm-hairline);
        }
        .vm-wordmark {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          font-family: 'DM Mono', monospace;
          font-weight: 500;
        }
        .vm-wordmark-text {
          font-size: 0.82rem;
          letter-spacing: 0.28em;
          color: var(--vm-lime);
          text-transform: uppercase;
        }
        .vm-wordmark-sep {
          color: var(--vm-hairline);
          font-size: 0.7rem;
        }
        .vm-wordmark-year {
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          color: var(--vm-mute);
        }
        .vm-topbar-date {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          color: var(--vm-mute);
        }

        /* Card base */
        .vm-card {
          background: linear-gradient(180deg, var(--vm-surface) 0%, var(--vm-surface2) 100%);
          border: 1px solid var(--vm-hairline);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        /* Hero card */
        .vm-hero-card {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
          margin: 1.5rem 1.5rem 0;
          padding: 1.75rem 2rem;
          flex-wrap: wrap;
        }
        .vm-hero-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          min-width: 200px;
        }
        .vm-greeting {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 2.8rem;
          line-height: 1;
          letter-spacing: -0.03em;
          margin: 0;
          color: var(--vm-text);
          align-self: flex-start;
        }
        .vm-hero-sub {
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vm-mute);
          margin: 0;
          align-self: flex-start;
        }
        .vm-rings-svg {
          display: block;
          margin-top: 0.5rem;
        }
        .vm-hero-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 200px;
          justify-content: center;
          padding-top: 0.5rem;
        }
        .vm-hero-stat {
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border-left: 3px solid currentColor;
          background: rgba(255,255,255,0.025);
        }
        .vm-hero-stat--lime { color: var(--vm-lime); }
        .vm-hero-stat--cyan { color: var(--vm-cyan); }
        .vm-hero-stat--magenta { color: var(--vm-magenta); }
        .vm-hero-stat-label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.24em;
          color: currentColor;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .vm-hero-stat-values {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }
        .vm-hero-stat-today {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.9rem;
          color: var(--vm-text);
          letter-spacing: -0.02em;
        }
        .vm-hero-stat-avg {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: var(--vm-mute);
          letter-spacing: 0.04em;
        }
        .vm-hero-stat-arrow {
          font-size: 0.65rem;
          color: currentColor;
          margin-right: 0.2em;
        }

        /* Metrics strip */
        .vm-metrics-strip {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin: 1rem 1.5rem 0;
        }
        @media (min-width: 800px) {
          .vm-metrics-strip { grid-template-columns: repeat(4, 1fr); }
        }
        .vm-metric-card {
          padding: 1.1rem 1.15rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .vm-metric-card::before {
          content: '';
          display: block;
          height: 2px;
          width: 32px;
          border-radius: 2px;
          margin-bottom: 0.6rem;
          background: currentColor;
          box-shadow: 0 0 6px currentColor;
        }
        .vm-metric-card--lime { color: var(--vm-lime); }
        .vm-metric-card--cyan { color: var(--vm-cyan); }
        .vm-metric-card--magenta { color: var(--vm-magenta); }
        .vm-metric-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vm-mute);
        }
        .vm-metric-value {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 2.6rem;
          line-height: 1;
          letter-spacing: -0.03em;
          margin: 0.2rem 0 0;
        }
        .vm-metric-unit {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          color: var(--vm-mute);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .vm-sparkline { display: block; }

        /* Section header */
        .vm-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .vm-section-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--vm-mute);
        }
        .vm-section-meta {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          color: var(--vm-mute);
        }
        .vm-admin-badge {
          background: rgba(202,255,51,0.12);
          color: var(--vm-lime);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(202,255,51,0.3);
        }

        /* Squads card */
        .vm-squads-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-squads-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .vm-squad-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--vm-hairline);
        }
        .vm-squad-row:last-child { border-bottom: none; }
        .vm-squad-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #444a60 0%, #232735 100%);
          border: 1px solid var(--vm-hairline);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--vm-text);
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .vm-squad-info {
          flex: 1;
          min-width: 0;
        }
        .vm-squad-name {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--vm-text);
          margin-bottom: 0.2rem;
        }
        .vm-squad-tour {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--vm-mute);
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vm-squad-track-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 120px;
          flex-shrink: 0;
        }
        .vm-squad-track {
          position: relative;
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 4px;
          overflow: visible;
        }
        .vm-squad-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, var(--vm-lime), rgba(202,255,51,0.6));
          border-radius: 4px;
          box-shadow: 0 0 6px var(--vm-lime);
          transition: width 0.6s ease;
        }
        .vm-squad-tip {
          position: absolute;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--vm-lime);
          box-shadow: 0 0 8px var(--vm-lime);
          transform: translate(-50%, -50%);
        }
        .vm-squad-pct {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--vm-mute);
          white-space: nowrap;
        }
        .vm-squad-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          flex-shrink: 0;
        }
        .vm-squad-pts {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.4rem;
          color: var(--vm-lime);
          letter-spacing: -0.02em;
        }
        .vm-squad-pts-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--vm-mute);
          letter-spacing: 0.12em;
          margin-left: 0.2rem;
        }
        .vm-squad-role {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
        }
        .vm-squad-role--captain {
          background: rgba(255,200,71,0.15);
          color: var(--vm-amber);
          border: 1px solid rgba(255,200,71,0.35);
        }
        .vm-squad-role--member {
          background: rgba(244,245,248,0.07);
          color: var(--vm-mute);
          border: 1px solid var(--vm-hairline);
        }
        .vm-crown {
          flex-shrink: 0;
          display: inline-block;
          vertical-align: middle;
        }

        /* Achievements */
        .vm-achievements {
          margin: 1rem 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }
        .vm-achievements-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--vm-mute);
          flex-shrink: 0;
        }
        .vm-achievements-chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .vm-chip {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .vm-chip--lime {
          color: var(--vm-lime);
          background: rgba(202,255,51,0.1);
          border: 1px solid rgba(202,255,51,0.3);
          box-shadow: 0 0 8px rgba(202,255,51,0.12);
        }
        .vm-chip--cyan {
          color: var(--vm-cyan);
          background: rgba(0,229,255,0.1);
          border: 1px solid rgba(0,229,255,0.3);
          box-shadow: 0 0 8px rgba(0,229,255,0.12);
        }
        .vm-chip--magenta {
          color: var(--vm-magenta);
          background: rgba(255,90,138,0.1);
          border: 1px solid rgba(255,90,138,0.3);
          box-shadow: 0 0 8px rgba(255,90,138,0.12);
        }
        .vm-chip--amber {
          color: var(--vm-amber);
          background: rgba(255,200,71,0.1);
          border: 1px solid rgba(255,200,71,0.3);
          box-shadow: 0 0 8px rgba(255,200,71,0.12);
        }

        /* Inbox & Queue */
        .vm-inbox-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 0;
          display: flex;
          gap: 0;
          flex-wrap: wrap;
        }
        .vm-inbox-col {
          flex: 1;
          min-width: 220px;
          padding: 0 1.5rem;
        }
        .vm-inbox-divider {
          width: 1px;
          background: var(--vm-hairline);
          align-self: stretch;
          flex-shrink: 0;
        }
        .vm-inbox-row {
          padding: 0.85rem 0;
          border-bottom: 1px solid var(--vm-hairline);
        }
        .vm-inbox-row:last-of-type { border-bottom: none; }
        .vm-inbox-row--lime { border-left: 2px solid var(--vm-lime); padding-left: 0.75rem; }
        .vm-inbox-row--cyan { border-left: 2px solid var(--vm-cyan); padding-left: 0.75rem; }
        .vm-inbox-row-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .vm-inbox-kind {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: currentColor;
        }
        .vm-inbox-time {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--vm-mute);
          letter-spacing: 0.05em;
        }
        .vm-inbox-title {
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--vm-text);
          margin-bottom: 0.15rem;
        }
        .vm-inbox-meta {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--vm-mute);
          letter-spacing: 0.04em;
          margin-bottom: 0.5rem;
        }
        .vm-inbox-actions { display: flex; gap: 0.4rem; }
        .vm-action-btn {
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          transition: all 150ms ease;
        }
        .vm-action-btn--primary {
          background: var(--vm-lime);
          color: #08090d;
          font-weight: 500;
        }
        .vm-action-btn--primary:hover { background: #d4ff50; }
        .vm-action-btn--outline {
          background: transparent;
          color: var(--vm-mute);
          border: 1px solid var(--vm-hairline);
        }
        .vm-action-btn--outline:hover { border-color: rgba(255,255,255,0.2); color: var(--vm-text); }

        /* Queue rows */
        .vm-queue-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--vm-hairline);
        }
        .vm-queue-row:last-child { border-bottom: none; }
        .vm-queue-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .vm-queue-title {
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          font-size: 0.88rem;
          color: var(--vm-text);
        }
        .vm-queue-meta {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--vm-mute);
          letter-spacing: 0.04em;
        }
        .vm-queue-status {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: var(--vm-mute);
          white-space: nowrap;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--vm-hairline);
        }
        .vm-queue-status--urgent {
          color: var(--vm-red);
          background: rgba(255,86,88,0.1);
          border-color: rgba(255,86,88,0.3);
        }

        /* Activity log */
        .vm-log-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-log-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .vm-log-row {
          display: grid;
          grid-template-columns: 5.5rem 10px 1fr;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--vm-hairline);
          font-size: 0.875rem;
        }
        .vm-log-row:last-child { border-bottom: none; }
        .vm-log-time {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--vm-mute);
          letter-spacing: 0.05em;
        }
        .vm-log-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          justify-self: center;
        }
        .vm-log-dot--lime {
          background: var(--vm-lime);
          box-shadow: 0 0 6px var(--vm-lime);
        }
        .vm-log-dot--red {
          background: var(--vm-red);
          box-shadow: 0 0 6px var(--vm-red);
        }
        .vm-log-dot--cyan {
          background: var(--vm-cyan);
          box-shadow: 0 0 6px var(--vm-cyan);
        }
        .vm-log-dot--magenta {
          background: var(--vm-magenta);
          box-shadow: 0 0 6px var(--vm-magenta);
        }
        .vm-log-desc {
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          color: var(--vm-text);
        }

        /* Captain's deck */
        .vm-captains-deck {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-gauges {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (min-width: 700px) {
          .vm-gauges { grid-template-columns: repeat(4, 1fr); }
        }
        .vm-gauge-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 1rem 0.75rem;
          background: rgba(255,255,255,0.025);
          border-radius: 14px;
          border: 1px solid var(--vm-hairline);
        }
        .vm-gauge-svg { display: block; }
        .vm-gauge-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vm-mute);
          text-align: center;
        }
        .vm-gauge-sub {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          color: var(--vm-mute);
          text-align: center;
          letter-spacing: 0.04em;
        }

        /* Captain (non-admin) card */
        .vm-captain-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-captain-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .vm-captain-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--vm-hairline);
        }
        .vm-captain-row:last-child { border-bottom: none; }
        .vm-captain-name {
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--vm-text);
          flex: 1;
        }
        .vm-captain-tour {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--vm-mute);
          flex: 1;
        }
        .vm-captain-pts {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--vm-lime);
          letter-spacing: -0.01em;
        }

        /* Ring legend */
        .vm-ring-legend {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .vm-legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .vm-legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .vm-legend-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vm-mute);
        }

        /* Empty state */
        .vm-empty {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: var(--vm-mute);
          letter-spacing: 0.06em;
          padding: 0.5rem 0;
        }

        /* Footer */
        .vm-footer {
          margin: 1.5rem 1.5rem 0;
          padding-top: 1rem;
          border-top: 1px solid var(--vm-hairline);
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vm-mute);
          text-align: center;
        }

        /* ── Animations ── */
        @keyframes vm-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vm-bar-fill {
          from { width: 0; }
        }
        @keyframes vm-pulse-glow {
          0%, 100% { box-shadow: 0 0 6px currentColor; }
          50%       { box-shadow: 0 0 14px currentColor, 0 0 28px rgba(202,255,51,0.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vm-standings-card,
          .vm-mvp-card,
          .vm-tape-card,
          .vm-lineup-card { animation: none !important; }
          .vm-standings-bar-fill,
          .vm-tape-prog-fill { animation: none !important; }
          .vm-metric-card::before { animation: none !important; }
        }
        .vm-standings-card { animation: vm-fade-up 0.35s ease both; }
        .vm-mvp-card       { animation: vm-fade-up 0.35s 0.1s ease both; }
        .vm-tape-card      { animation: vm-fade-up 0.35s 0.2s ease both; }
        .vm-lineup-card    { animation: vm-fade-up 0.35s 0.3s ease both; }
        .vm-standings-bar-fill { animation: vm-bar-fill 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .vm-tape-prog-fill     { animation: vm-bar-fill 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
        .vm-metric-card::before { animation: vm-pulse-glow 3s ease-in-out infinite; }

        /* Card hover lift */
        .vm-card {
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        .vm-card:hover {
          transform: translateY(-1px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.35);
        }

        /* ── League Standings ── */
        .vm-standings-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-standings-table {
          display: flex;
          flex-direction: column;
        }
        .vm-standings-row {
          display: grid;
          grid-template-columns: 2.2rem 1fr 1fr 2.8rem 2.2rem 8rem;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--vm-hairline);
          transition: background 120ms ease;
        }
        .vm-standings-row:last-child { border-bottom: none; }
        .vm-standings-row:hover { background: rgba(202,255,51,0.03); border-radius: 8px; }
        .vm-standings-rank {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--vm-mute);
          letter-spacing: -0.02em;
        }
        .vm-standings-team {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          min-width: 0;
        }
        .vm-standings-name {
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          font-size: 0.88rem;
          color: var(--vm-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vm-standings-tour {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--vm-mute);
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vm-standings-role {
          font-family: 'DM Mono', monospace;
          font-size: 0.55rem;
          letter-spacing: 0.14em;
          padding: 0.12rem 0.4rem;
          border-radius: 999px;
          text-align: center;
        }
        .vm-standings-role--captain {
          color: var(--vm-amber);
          background: rgba(255,200,71,0.12);
          border: 1px solid rgba(255,200,71,0.3);
        }
        .vm-standings-role--member {
          color: var(--vm-mute);
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--vm-hairline);
        }
        .vm-standings-members {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--vm-mute);
          text-align: right;
        }
        .vm-standings-bar-wrap {
          position: relative;
          height: 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .vm-standings-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: linear-gradient(90deg, var(--vm-lime), rgba(202,255,51,0.55));
          border-radius: 4px;
          filter: drop-shadow(0 0 4px var(--vm-lime));
        }
        .vm-standings-pts {
          position: relative;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          color: #08090d;
          padding: 0 0.4rem;
          z-index: 1;
          mix-blend-mode: difference;
          filter: invert(1);
        }

        /* ── MVP of the Day ── */
        .vm-mvp-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
          border-color: rgba(202,255,51,0.3);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 32px rgba(202,255,51,0.06);
        }
        .vm-mvp-inner {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .vm-mvp-trophy {
          flex-shrink: 0;
          filter: drop-shadow(0 0 12px rgba(202,255,51,0.5));
        }
        .vm-mvp-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .vm-mvp-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--vm-lime);
        }
        .vm-mvp-name {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.55rem;
          color: var(--vm-text);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .vm-mvp-detail {
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          color: var(--vm-mute);
          letter-spacing: 0.04em;
          margin: 0;
        }
        .vm-mvp-detail strong { color: var(--vm-text); }

        /* ── Tale of the Tape ── */
        .vm-tape-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-tape-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
        }
        .vm-tape-col {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .vm-tape-col--right {
          align-items: flex-end;
          text-align: right;
        }
        .vm-tape-col-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--vm-lime);
        }
        .vm-tape-col--right .vm-tape-col-label { color: var(--vm-magenta); }
        .vm-tape-team-name {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--vm-text);
        }
        .vm-tape-captain {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          color: var(--vm-amber);
        }
        .vm-tape-col--right .vm-tape-captain { flex-direction: row-reverse; }
        .vm-tape-stat {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
        }
        .vm-tape-col--right .vm-tape-stat { flex-direction: row-reverse; }
        .vm-tape-stat-num {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.4rem;
          color: var(--vm-text);
          letter-spacing: -0.02em;
        }
        .vm-tape-stat-num--pts { color: var(--vm-lime); }
        .vm-tape-col--right .vm-tape-stat-num--pts { color: var(--vm-magenta); }
        .vm-tape-stat-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--vm-mute);
          letter-spacing: 0.08em;
        }
        .vm-tape-progress { width: 100%; }
        .vm-tape-prog-track {
          height: 3px;
          background: rgba(255,255,255,0.07);
          border-radius: 3px;
          margin-top: 0.25rem;
          overflow: hidden;
        }
        .vm-tape-prog-fill {
          height: 100%;
          background: var(--vm-lime);
          border-radius: 3px;
          box-shadow: 0 0 6px var(--vm-lime);
        }
        .vm-tape-col--right .vm-tape-prog-fill { background: var(--vm-magenta); box-shadow: 0 0 6px var(--vm-magenta); }
        .vm-tape-delta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--vm-hairline);
          min-width: 80px;
        }
        .vm-tape-delta-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.52rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .vm-tape-delta-num {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.7rem;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .vm-tape-delta--ahead { color: var(--vm-lime); text-shadow: 0 0 12px rgba(202,255,51,0.6); }
        .vm-tape-delta--behind { color: var(--vm-magenta); text-shadow: 0 0 12px rgba(255,90,138,0.6); }
        .vm-tape-delta-unit {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          color: var(--vm-mute);
          letter-spacing: 0.12em;
        }

        /* ── Today's Lineup ── */
        .vm-lineup-card {
          margin: 1rem 1.5rem 0;
          padding: 1.4rem 1.5rem;
        }
        .vm-lineup-list {
          display: flex;
          flex-direction: column;
        }
        .vm-lineup-row {
          display: grid;
          grid-template-columns: 2.4rem 1fr 4.5rem 4rem 3rem;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0;
          border-bottom: 1px solid var(--vm-hairline);
          transition: background 120ms ease;
        }
        .vm-lineup-row:last-child { border-bottom: none; }
        .vm-lineup-row:hover { background: rgba(0,229,255,0.03); border-radius: 6px; }
        .vm-lineup-num {
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          font-size: 0.78rem;
          color: var(--vm-mute);
          letter-spacing: 0.06em;
        }
        .vm-lineup-name {
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--vm-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vm-lineup-role {
          font-family: 'DM Mono', monospace;
          font-size: 0.55rem;
          letter-spacing: 0.14em;
          padding: 0.12rem 0.4rem;
          border-radius: 999px;
          text-align: center;
        }
        .vm-lineup-role--captain {
          color: var(--vm-amber);
          background: rgba(255,200,71,0.12);
          border: 1px solid rgba(255,200,71,0.3);
        }
        .vm-lineup-role--member {
          color: var(--vm-mute);
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--vm-hairline);
        }
        .vm-lineup-pts {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--vm-lime);
          text-align: right;
          letter-spacing: 0.04em;
        }
        .vm-lineup-members {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--vm-mute);
          text-align: right;
          letter-spacing: 0.04em;
        }
      `,
      }}
    />
  );
}
