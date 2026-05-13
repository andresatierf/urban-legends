"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tournamentProgress(tournament: {
  startDate: string;
  endDate: string;
}): number {
  const now = Date.now();
  const start = new Date(tournament.startDate).getTime();
  const end = new Date(tournament.endDate).getTime();
  if (end <= start) return 0;
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}

// ---------------------------------------------------------------------------
// SVG primitives
// ---------------------------------------------------------------------------

function PixelCrownSvg() {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      aria-hidden
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <polygon
        points="0,12 2,4 5,8 7,0 9,8 12,4 14,12"
        fill="#ffd84d"
        style={{ filter: "drop-shadow(0 0 4px #ffd84d)" }}
      />
    </svg>
  );
}

function PixelTrophySvg() {
  return (
    <svg width="40" height="44" viewBox="0 0 40 44" fill="none" aria-hidden>
      <rect x="14" y="36" width="12" height="4" fill="#ffd84d" />
      <rect x="10" y="40" width="20" height="4" fill="#ffd84d" />
      <rect x="12" y="32" width="16" height="4" fill="#ffd84d" />
      <rect x="8" y="4" width="4" height="20" fill="#ffd84d" />
      <rect x="28" y="4" width="4" height="20" fill="#ffd84d" />
      <rect x="4" y="4" width="4" height="8" fill="#ffd84d" />
      <rect x="32" y="4" width="4" height="8" fill="#ffd84d" />
      <rect x="4" y="8" width="4" height="4" fill="#ffd84d" />
      <rect x="32" y="8" width="4" height="4" fill="#ffd84d" />
      <rect x="12" y="0" width="16" height="4" fill="#ffd84d" />
      <rect x="8" y="0" width="4" height="4" fill="#ffd84d" />
      <rect x="28" y="0" width="4" height="4" fill="#ffd84d" />
      <rect x="12" y="4" width="16" height="24" fill="#ffd84d" />
      <rect x="8" y="24" width="24" height="4" fill="#ffd84d" />
      {/* shine */}
      <rect x="16" y="6" width="4" height="8" fill="#fff8d6" opacity="0.5" />
      <style>{`
        @keyframes trophy-pulse {
          0%,100% { filter: drop-shadow(0 0 4px #ffd84d); }
          50% { filter: drop-shadow(0 0 12px #ffd84d) drop-shadow(0 0 20px #ffb800); }
        }
      `}</style>
      <g style={{ animation: "trophy-pulse 2s ease-in-out infinite" }}>
        <rect x="12" y="0" width="16" height="4" fill="none" />
      </g>
    </svg>
  );
}

function JoystickSvg() {
  return (
    <svg width="24" height="28" viewBox="0 0 24 28" fill="none" aria-hidden>
      <rect x="9" y="14" width="6" height="10" fill="#00f0ff" />
      <rect x="7" y="22" width="10" height="4" fill="#00f0ff" />
      <rect x="5" y="24" width="14" height="4" fill="#00f0ff" />
      <rect x="8" y="4" width="8" height="10" fill="#00f0ff" />
      <rect x="6" y="6" width="12" height="6" fill="#00f0ff" />
      <rect x="10" y="0" width="4" height="6" fill="#00f0ff" />
      <rect x="8" y="2" width="8" height="4" fill="#00f0ff" />
      {/* ball top */}
      <rect x="9" y="0" width="6" height="2" fill="#ff2bd6" />
      <rect x="8" y="2" width="8" height="2" fill="#ff2bd6" />
    </svg>
  );
}

function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
      }}
    />
  );
}

function HudCorners({ color = "#00f0ff" }: { color?: string }) {
  return (
    <>
      {/* top-left */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 16,
          height: 16,
          borderTop: `2px solid ${color}`,
          borderLeft: `2px solid ${color}`,
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
      {/* top-right */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 16,
          height: 16,
          borderTop: `2px solid ${color}`,
          borderRight: `2px solid ${color}`,
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
      {/* bottom-left */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 16,
          height: 16,
          borderBottom: `2px solid ${color}`,
          borderLeft: `2px solid ${color}`,
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
      {/* bottom-right */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          borderBottom: `2px solid ${color}`,
          borderRight: `2px solid ${color}`,
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </>
  );
}

function Sparkline({
  values,
  color,
  width = 72,
  height = 24,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * (height - 4)}`)
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <polyline
        points={points}
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

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionLabel({
  label,
  accent = "#00f0ff",
}: {
  label: string;
  accent?: string;
}) {
  return (
    <div className="vt-section-label">
      <span
        className="vt-section-label-text"
        style={{
          color: accent,
          textShadow: `0 0 8px ${accent}`,
        }}
      >
        {label}
      </span>
      <div
        className="vt-section-rule"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric card (M-style)
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  unit,
  accent,
  sparkline,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent: string;
  sparkline: number[];
}) {
  return (
    <div className="vt-metric-card" style={{ borderColor: accent }}>
      <HudCorners color={accent} />
      <div
        className="vt-metric-top-rule"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
      />
      <span className="vt-metric-label">{label}</span>
      <span
        className="vt-metric-value"
        style={{ color: accent, textShadow: `0 0 12px ${accent}` }}
      >
        {value}
      </span>
      <span className="vt-metric-unit">{unit}</span>
      <Sparkline values={sparkline} color={accent} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HUD readout (inline stat display)
// ---------------------------------------------------------------------------

function HudReadout({
  label,
  value,
  accent = "#00f0ff",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="vt-hud-readout">
      <span className="vt-hud-readout-label">{label}</span>
      <span
        className="vt-hud-readout-value"
        style={{ color: accent, textShadow: `0 0 8px ${accent}` }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant T
// ---------------------------------------------------------------------------

export function DashboardVariantT({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();

  // ── Standings ──
  const standings = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const maxPts = Math.max(...standings.map((t) => t.team.points), 1);

  // ── Metrics ──
  const approvedActivities = data.activities.filter(
    (a) => a.type === "submission_approved",
  );
  const todayApproved = approvedActivities.filter((a) => {
    return new Date(a.timestamp).toISOString().slice(0, 10) === today;
  }).length;

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    new Date(nowMs - i * 86_400_000).toISOString().slice(0, 10),
  );
  const activeDays = new Set(
    data.activities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = last7Days.filter((d) => activeDays.has(d)).length;

  const weekStart = new Date(nowMs - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekActivities = data.activities.filter((a) => {
    return new Date(a.timestamp).toISOString().slice(0, 10) >= weekStart;
  }).length;

  const activeTeams = data.teams.filter(
    (t) => t.tournament.startDate <= today && t.tournament.endDate >= today,
  );
  const topTeam =
    activeTeams.length > 0
      ? activeTeams.reduce((best, t) =>
          t.team.points > best.team.points ? t : best,
        )
      : (data.teams[0] ?? null);

  const squadRank = topTeam
    ? data.teams.filter(
        (t) =>
          t.tournament._id === topTeam.tournament._id &&
          t.team.points > topTeam.team.points,
      ).length + 1
    : 1;

  // Sparklines: per-day approved activity counts for last 7 days (oldest → newest)
  const sparklineData = last7Days
    .slice()
    .reverse()
    .map(
      (d) =>
        approvedActivities.filter(
          (a) => new Date(a.timestamp).toISOString().slice(0, 10) === d,
        ).length,
    );

  // ── MVP (team-level Team of the Day) ──
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

  // ── Rival (P-style) ──
  const sortedByPoints = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const userTopTeam = sortedByPoints[0] ?? null;
  const rivalTeam =
    sortedByPoints.length > 1
      ? (sortedByPoints.find((t) => t.team._id !== userTopTeam?.team._id) ??
        null)
      : null;
  const rivalName = rivalTeam?.team.name ?? "Iron Wolves";
  const rivalPoints = rivalTeam ? rivalTeam.team.points + 80 : 400;
  const rivalMembers = rivalTeam?.memberCount ?? 5;
  const rivalProgress = rivalTeam
    ? tournamentProgress(rivalTeam.tournament)
    : 0.72;
  const userProgress = userTopTeam
    ? tournamentProgress(userTopTeam.tournament)
    : 0;

  // ── Player count ──
  const totalMemberCount = data.teams.reduce(
    (sum, t) => sum + t.memberCount,
    0,
  );
  const joinedThisWeek = data.activities.filter(
    (a) =>
      a.type === "team_member_joined" &&
      new Date(a.timestamp).toISOString().slice(0, 10) >= weekStart,
  ).length;
  const playerTotal =
    data.isAdmin && data.adminStats
      ? data.adminStats.users.total
      : totalMemberCount;
  const playerDelta =
    data.isAdmin && data.adminStats
      ? data.adminStats.users.newThisWeek
      : joinedThisWeek;

  // ── Admin stats ──
  const approvalPct = data.adminStats
    ? Math.round(
        (data.adminStats.submissions.approved /
          Math.max(
            data.adminStats.submissions.approved +
              data.adminStats.submissions.rejected,
            1,
          )) *
          100,
      )
    : 0;

  return (
    <>
      <VariantTStyles />
      <ScanlineOverlay />
      <div className="vt-root">
        {/* ═══════════════════════════════════════════════════════
            HERO — INSERT COIN
        ═══════════════════════════════════════════════════════ */}
        <header className="vt-hero">
          <HudCorners color="#ff2bd6" />
          <div className="vt-hero-inner">
            <div className="vt-marquee-wrap" aria-hidden>
              <div className="vt-marquee-track">
                <span className="vt-marquee-text">
                  ★ URBAN LEGENDS ARCADE ★ HIGH SCORE TABLE ★ PRESS START ★
                  PLAYER 1 READY ★ URBAN LEGENDS ARCADE ★ HIGH SCORE TABLE ★
                  PRESS START ★ PLAYER 1 READY ★&nbsp;
                </span>
                <span className="vt-marquee-text" aria-hidden>
                  ★ URBAN LEGENDS ARCADE ★ HIGH SCORE TABLE ★ PRESS START ★
                  PLAYER 1 READY ★ URBAN LEGENDS ARCADE ★ HIGH SCORE TABLE ★
                  PRESS START ★ PLAYER 1 READY ★&nbsp;
                </span>
              </div>
            </div>

            <div className="vt-hero-credits">
              <span className="vt-credits-label">CREDITS</span>
              <span className="vt-credits-value">99</span>
            </div>

            <h1 className="vt-hero-title">
              <span className="vt-hero-game-on">GAME ON,</span>
              <span className="vt-hero-name">
                {data.userName.toUpperCase()}
              </span>
            </h1>

            <div className="vt-press-start">▶ PRESS START ◀</div>

            <div className="vt-hero-hud-row">
              <HudReadout
                label="TOURNAMENTS"
                value={String(data.activeTournamentsCount)}
                accent="#00f0ff"
              />
              <HudReadout
                label="PENDING"
                value={String(data.pendingSubmissionsCount)}
                accent="#ffd84d"
              />
              <HudReadout
                label="INBOX"
                value={String(data.invitationsCount + data.joinRequests.length)}
                accent="#ff2bd6"
              />
              <HudReadout
                label="PLAYER COUNT"
                value={`${playerTotal} (+${playerDelta})`}
                accent="#00f0ff"
              />
            </div>
          </div>
        </header>

        <main className="vt-main">
          {/* ═══════════════════════════════════════════════════════
              METRIC CARDS
          ═══════════════════════════════════════════════════════ */}
          <section className="vt-section">
            <SectionLabel label="// HUD STATS //" accent="#ff2bd6" />
            <div className="vt-metrics-row">
              <MetricCard
                label="STREAK"
                value={streakDays}
                unit="DAYS"
                accent="#ffd84d"
                sparkline={sparklineData}
              />
              <MetricCard
                label="THIS WEEK"
                value={weekActivities}
                unit="ACTIVITIES"
                accent="#00f0ff"
                sparkline={sparklineData}
              />
              <MetricCard
                label="TODAY APPROVED"
                value={todayApproved}
                unit="SUBMISSIONS"
                accent="#ff2bd6"
                sparkline={sparklineData}
              />
              <MetricCard
                label="SQUAD RANK"
                value={`#${squadRank}`}
                unit="POSITION"
                accent="#ffd84d"
                sparkline={[1, 2, 1, 3, 2, 4, squadRank]}
              />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              PLAYER COUNT HUD READOUT
          ═══════════════════════════════════════════════════════ */}
          <section className="vt-section">
            <SectionLabel label="// PLAYER COUNT //" accent="#00f0ff" />
            <div className="vt-player-count-banner">
              <HudCorners color="#00f0ff" />
              <div className="vt-player-count-inner">
                <div className="vt-player-count-icon">
                  <JoystickSvg />
                </div>
                <div className="vt-player-count-text">
                  <span
                    className="vt-player-count-num"
                    style={{
                      color: "#00f0ff",
                      textShadow: "0 0 12px #00f0ff, 0 0 24px #00f0ff88",
                    }}
                  >
                    {playerTotal}
                  </span>
                  <span className="vt-player-count-label">PLAYERS</span>
                </div>
                <div className="vt-player-count-delta">
                  <span
                    className="vt-delta-badge"
                    style={{
                      color: "#ffd84d",
                      textShadow: "0 0 8px #ffd84d",
                    }}
                  >
                    +{playerDelta} JOINED THIS WK
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              MVP OF THE DAY — HIGH SCORE ENTRY
          ═══════════════════════════════════════════════════════ */}
          <section className="vt-section">
            <SectionLabel label="// SQUAD OF THE DAY //" accent="#ffd84d" />
            <div className="vt-mvp-card">
              <HudCorners color="#ffd84d" />
              <div className="vt-mvp-inner">
                <div className="vt-mvp-trophy">
                  <PixelTrophySvg />
                </div>
                {mvpTeam ? (
                  <div className="vt-mvp-body">
                    <div
                      className="vt-mvp-ribbon"
                      style={{
                        color: "#ffd84d",
                        textShadow: "0 0 8px #ffd84d",
                      }}
                    >
                      TOP SQUAD
                    </div>
                    <div className="vt-mvp-player-label">TEAM 1 READY</div>
                    <div
                      className="vt-mvp-name"
                      style={{
                        color: "#ff2bd6",
                        textShadow: "0 0 12px #ff2bd6, 0 0 24px #ff2bd688",
                      }}
                    >
                      {mvpTeam.team.name.toUpperCase()}
                    </div>
                    <p className="vt-mvp-detail">
                      {mvpDisplayCount} submission
                      {mvpDisplayCount === 1 ? "" : "s"}{" "}
                      {mvpCountToday > 0 ? "today" : "this period"}
                      {" — "}
                      <span
                        style={{
                          color: "#00f0ff",
                          textShadow: "0 0 8px #00f0ff",
                        }}
                      >
                        {mvpTeam.tournament.name.toUpperCase()}
                      </span>
                      {" · "}
                      {mvpTeam.memberCount} member
                      {mvpTeam.memberCount === 1 ? "" : "s"}
                      {mvpTeam.userRole === "captain" && (
                        <span
                          style={{
                            color: "#ffd84d",
                            textShadow: "0 0 8px #ffd84d",
                          }}
                        >
                          {" ★ CAPTAIN"}
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="vt-mvp-body">
                    <div
                      className="vt-mvp-ribbon"
                      style={{
                        color: "#ffd84d",
                        textShadow: "0 0 8px #ffd84d",
                      }}
                    >
                      TOP SQUAD
                    </div>
                    <div className="vt-mvp-player-label">TEAM 1 READY</div>
                    <div
                      className="vt-mvp-name"
                      style={{
                        color: "#ff2bd6",
                        textShadow: "0 0 12px #ff2bd6, 0 0 24px #ff2bd688",
                      }}
                    >
                      NO SQUAD YET
                    </div>
                    <p className="vt-mvp-detail">
                      JOIN A TEAM TO ENTER THE ARENA
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              LEAGUE STANDINGS — HIGH SCORE TABLE
          ═══════════════════════════════════════════════════════ */}
          <section className="vt-section">
            <SectionLabel label="// LEAGUE STANDINGS //" accent="#ff2bd6" />
            <div className="vt-standings-wrap">
              <HudCorners color="#ff2bd6" />
              <table className="vt-table">
                <thead>
                  <tr className="vt-table-head-row">
                    <th className="vt-th vt-th--rank">#</th>
                    <th className="vt-th">TEAM</th>
                    <th className="vt-th vt-th--hide-sm">TOURNAMENT</th>
                    <th className="vt-th">ROLE</th>
                    <th className="vt-th vt-th--hide-sm">MBR</th>
                    <th className="vt-th">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr
                      key={t.team._id}
                      className={`vt-table-row${i === 0 ? " vt-table-row--top" : ""}`}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <td className="vt-td vt-td--rank">
                        {i === 0 && (
                          <span className="vt-rank-cursor" aria-hidden>
                            ▌
                          </span>
                        )}
                        <span
                          style={
                            i === 0
                              ? {
                                  color: "#ffd84d",
                                  textShadow: "0 0 8px #ffd84d",
                                }
                              : {}
                          }
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="vt-td vt-td--team">
                        <span className="vt-team-name">
                          {t.userRole === "captain" && <PixelCrownSvg />}{" "}
                          {t.team.name}
                        </span>
                        {t.userRole === "captain" && (
                          <span
                            className="vt-cap-badge"
                            style={{
                              color: "#ffd84d",
                              textShadow: "0 0 6px #ffd84d",
                            }}
                          >
                            CPT
                          </span>
                        )}
                      </td>
                      <td className="vt-td vt-td--hide-sm vt-td--tour">
                        {t.tournament.name}
                      </td>
                      <td className="vt-td">
                        <span
                          className={`vt-role-badge vt-role-badge--${t.userRole}`}
                        >
                          {t.userRole.toUpperCase()}
                        </span>
                      </td>
                      <td className="vt-td vt-td--hide-sm vt-td--num">
                        {String(t.memberCount).padStart(2, "0")}
                      </td>
                      <td className="vt-td vt-td--pts">
                        <div className="vt-pts-bar-wrap">
                          <div
                            className="vt-pts-bar-fill"
                            style={{
                              width: `${(t.team.points / maxPts) * 100}%`,
                              animationDelay: `${i * 80 + 200}ms`,
                            }}
                          />
                          <span
                            className="vt-pts-num"
                            style={
                              i === 0
                                ? {
                                    color: "#ffd84d",
                                    textShadow: "0 0 8px #ffd84d",
                                  }
                                : {}
                            }
                          >
                            {String(t.team.points).padStart(4, "0")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              VS SCREEN — TALE OF THE TAPE
          ═══════════════════════════════════════════════════════ */}
          {userTopTeam && (
            <section className="vt-section">
              <SectionLabel label="// VS SCREEN //" accent="#00f0ff" />
              <div className="vt-vs-card">
                <HudCorners color="#00f0ff" />
                <div className="vt-vs-columns">
                  {/* User side */}
                  <div className="vt-vs-col vt-vs-col--player">
                    <div
                      className="vt-vs-side-label"
                      style={{
                        color: "#00f0ff",
                        textShadow: "0 0 8px #00f0ff",
                      }}
                    >
                      YOUR SQUAD
                    </div>
                    <div className="vt-vs-team-name">
                      {userTopTeam.team.name}
                    </div>
                    <div
                      className="vt-vs-role"
                      style={
                        userTopTeam.userRole === "captain"
                          ? { color: "#ffd84d", textShadow: "0 0 6px #ffd84d" }
                          : {}
                      }
                    >
                      {userTopTeam.userRole === "captain"
                        ? "★ CAPTAIN"
                        : "MEMBER"}
                    </div>
                    <div className="vt-vs-divider" />
                    <VsStat
                      label="POINTS"
                      value={userTopTeam.team.points}
                      accent="#00f0ff"
                    />
                    <VsStat label="MEMBERS" value={userTopTeam.memberCount} />
                    <VsStat
                      label="PROGRESS"
                      value={`${Math.round(userProgress * 100)}%`}
                    />
                    <VsStat
                      label="TOURNAMENT"
                      value={userTopTeam.tournament.name}
                      small
                    />
                  </div>

                  {/* VS lozenge */}
                  <div className="vt-vs-divider-col">
                    <div className="vt-vs-lozenge">
                      <span
                        className="vt-vs-text"
                        style={{
                          color: "#ff2bd6",
                          textShadow: "0 0 16px #ff2bd6, 0 0 32px #ff2bd688",
                        }}
                      >
                        VS
                      </span>
                    </div>
                    <div className="vt-vs-delta">
                      {userTopTeam.team.points >= rivalPoints ? (
                        <span
                          className="vt-delta-ahead"
                          style={{
                            color: "#ffd84d",
                            textShadow: "0 0 6px #ffd84d",
                          }}
                        >
                          ↑ +{userTopTeam.team.points - rivalPoints}
                        </span>
                      ) : (
                        <span
                          className="vt-delta-behind"
                          style={{
                            color: "#ff2bd6",
                            textShadow: "0 0 6px #ff2bd6",
                          }}
                        >
                          ↓ -{rivalPoints - userTopTeam.team.points}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rival side */}
                  <div className="vt-vs-col vt-vs-col--rival">
                    <div
                      className="vt-vs-side-label"
                      style={{
                        color: "#ff2bd6",
                        textShadow: "0 0 8px #ff2bd6",
                      }}
                    >
                      TOP RIVAL
                    </div>
                    <div className="vt-vs-team-name">{rivalName}</div>
                    <div className="vt-vs-role">OPPONENT</div>
                    <div className="vt-vs-divider" />
                    <VsStat
                      label="POINTS"
                      value={rivalPoints}
                      accent="#ff2bd6"
                    />
                    <VsStat label="MEMBERS" value={rivalMembers} />
                    <VsStat
                      label="PROGRESS"
                      value={`${Math.round(rivalProgress * 100)}%`}
                    />
                    <VsStat
                      label="TOURNAMENT"
                      value={
                        rivalTeam
                          ? rivalTeam.tournament.name
                          : userTopTeam.tournament.name
                      }
                      small
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════
              TODAY'S LINEUP — ROSTER
          ═══════════════════════════════════════════════════════ */}
          <section className="vt-section">
            <SectionLabel label="// TODAY'S LINEUP //" accent="#ffd84d" />
            <div className="vt-lineup-list">
              {data.teams.length === 0 && (
                <p className="vt-empty">NO TEAMS ON ROSTER YET.</p>
              )}
              {data.teams.map((t, idx) => (
                <div
                  key={t.team._id}
                  className="vt-lineup-row"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <HudCorners
                    color={t.userRole === "captain" ? "#ffd84d" : "#00f0ff"}
                  />
                  <span
                    className="vt-lineup-slot"
                    style={{
                      color: "#ff2bd6",
                      textShadow: "0 0 6px #ff2bd6",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="vt-lineup-info">
                    <span className="vt-lineup-name">{t.team.name}</span>
                    <span className="vt-lineup-tour">{t.tournament.name}</span>
                  </div>
                  <div className="vt-lineup-right">
                    <span
                      className={`vt-lineup-badge vt-lineup-badge--${t.userRole}`}
                    >
                      {t.userRole === "captain" ? "CPT" : "MBR"}
                    </span>
                    <span className="vt-lineup-pts">
                      {String(t.team.points).padStart(4, "0")}
                    </span>
                    <span className="vt-lineup-members">
                      {String(t.memberCount).padStart(2, "0")} PLY
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              INCOMING TRANSMISSIONS — invitations + join requests
          ═══════════════════════════════════════════════════════ */}
          {(data.invitations.length > 0 || data.joinRequests.length > 0) && (
            <section className="vt-section">
              <SectionLabel
                label="// INCOMING TRANSMISSIONS //"
                accent="#ff2bd6"
              />
              <div className="vt-inbox-list">
                {data.invitations.map((inv, i) => (
                  <div
                    key={inv.id}
                    className="vt-inbox-item vt-inbox-item--inv"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <HudCorners color="#ff2bd6" />
                    <div className="vt-inbox-header">
                      <span
                        className="vt-inbox-tag"
                        style={{
                          color: "#ff2bd6",
                          textShadow: "0 0 6px #ff2bd6",
                          borderColor: "#ff2bd6",
                        }}
                      >
                        INVITATION
                      </span>
                      <span className="vt-inbox-time">
                        {formatRelative(inv.timestamp).toUpperCase()}
                      </span>
                    </div>
                    <div className="vt-inbox-body">
                      <span className="vt-inbox-main">
                        {inv.invitedBy.toUpperCase()} WANTS YOU ON{" "}
                        <span
                          style={{
                            color: "#00f0ff",
                            textShadow: "0 0 6px #00f0ff",
                          }}
                        >
                          {inv.teamName.toUpperCase()}
                        </span>
                      </span>
                      <span className="vt-inbox-sub">
                        {inv.tournamentName.toUpperCase()}
                      </span>
                    </div>
                    <div className="vt-inbox-actions">
                      <button className="vt-btn vt-btn--accept" type="button">
                        PLAYER 2!
                      </button>
                      <button className="vt-btn vt-btn--reject" type="button">
                        GAME OVER
                      </button>
                    </div>
                  </div>
                ))}
                {data.joinRequests.map((req, i) => (
                  <div
                    key={req.id}
                    className="vt-inbox-item vt-inbox-item--req"
                    style={{
                      animationDelay: `${(data.invitations.length + i) * 80}ms`,
                    }}
                  >
                    <HudCorners color="#ffd84d" />
                    <div className="vt-inbox-header">
                      <span
                        className="vt-inbox-tag"
                        style={{
                          color: "#ffd84d",
                          textShadow: "0 0 6px #ffd84d",
                          borderColor: "#ffd84d",
                        }}
                      >
                        JOIN REQUEST
                      </span>
                      <span className="vt-inbox-time">
                        {formatRelative(req.timestamp).toUpperCase()}
                      </span>
                    </div>
                    <div className="vt-inbox-body">
                      <span className="vt-inbox-main">
                        <span
                          style={{
                            color: "#ffd84d",
                            textShadow: "0 0 6px #ffd84d",
                          }}
                        >
                          {req.userName.toUpperCase()}
                        </span>{" "}
                        WANTS IN &rarr;{" "}
                        <span
                          style={{
                            color: "#00f0ff",
                            textShadow: "0 0 6px #00f0ff",
                          }}
                        >
                          {req.teamName.toUpperCase()}
                        </span>
                      </span>
                    </div>
                    <div className="vt-inbox-actions">
                      <button className="vt-btn vt-btn--accept" type="button">
                        INSERT COIN
                      </button>
                      <button className="vt-btn vt-btn--reject" type="button">
                        BAIL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════
              PENDING SUBMISSIONS
          ═══════════════════════════════════════════════════════ */}
          {data.pendingSubmissions.length > 0 && (
            <section className="vt-section">
              <SectionLabel label="// PENDING QUEUE //" accent="#ffd84d" />
              <div className="vt-submissions-list">
                {data.pendingSubmissions.map((sub, i) => (
                  <div
                    key={sub.id}
                    className="vt-sub-item"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <HudCorners color="#ffd84d" />
                    <div className="vt-sub-status vt-sub-status--pending">
                      PENDING
                    </div>
                    <div className="vt-sub-info">
                      <span className="vt-sub-team">
                        {sub.teamName.toUpperCase()}
                      </span>
                      <span className="vt-sub-tour">
                        {sub.tournamentName.toUpperCase()}
                      </span>
                      <span className="vt-sub-date">{sub.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════
              DEADLINES
          ═══════════════════════════════════════════════════════ */}
          {data.deadlines.length > 0 && (
            <section className="vt-section">
              <SectionLabel label="// COUNTDOWN //" accent="#ff2bd6" />
              <div className="vt-deadlines-list">
                {data.deadlines.map((d, i) => {
                  const urgent = d.daysUntilEnd <= 3;
                  return (
                    <div
                      key={d.tournament._id}
                      className={`vt-deadline-item${urgent ? " vt-deadline-item--urgent" : ""}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <HudCorners color={urgent ? "#ff2bd6" : "#ffd84d"} />
                      <span
                        className="vt-deadline-days"
                        style={
                          urgent
                            ? {
                                color: "#ff2bd6",
                                textShadow: "0 0 10px #ff2bd6",
                              }
                            : {
                                color: "#ffd84d",
                                textShadow: "0 0 8px #ffd84d",
                              }
                        }
                      >
                        {d.daysUntilEnd}D
                      </span>
                      <div className="vt-deadline-info">
                        <span className="vt-deadline-name">
                          {d.tournament.name.toUpperCase()}
                        </span>
                        {urgent && (
                          <span
                            className="vt-deadline-warn"
                            style={{
                              color: "#ff2bd6",
                              textShadow: "0 0 6px #ff2bd6",
                            }}
                          >
                            ⚠ CRITICAL — LOG NOW
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════
              ACTIVITY FEED
          ═══════════════════════════════════════════════════════ */}
          <section className="vt-section">
            <SectionLabel label="// ACTIVITY LOG //" accent="#00f0ff" />
            <div className="vt-activity-list">
              {data.activities.length === 0 && (
                <p className="vt-empty">NO ACTIVITY RECORDED.</p>
              )}
              {data.activities.map((a, i) => (
                <div
                  key={i}
                  className="vt-activity-item"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span
                    className={`vt-activity-dot vt-activity-dot--${a.type.includes("approved") ? "approved" : a.type.includes("rejected") ? "rejected" : "neutral"}`}
                  />
                  <div className="vt-activity-body">
                    <span className="vt-activity-desc">
                      {a.description.toUpperCase()}
                    </span>
                    <span className="vt-activity-time">
                      {formatRelative(a.timestamp).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              ADMIN CONSOLE
          ═══════════════════════════════════════════════════════ */}
          {data.isAdmin && data.adminStats && (
            <section className="vt-section">
              <SectionLabel
                label="// OPERATOR MODE — ADMIN CONSOLE //"
                accent="#ffd84d"
              />
              <div className="vt-admin-grid">
                <div className="vt-admin-card">
                  <HudCorners color="#ffd84d" />
                  <span
                    className="vt-admin-label"
                    style={{ color: "#ffd84d", textShadow: "0 0 6px #ffd84d" }}
                  >
                    TOURNAMENTS
                  </span>
                  <div className="vt-admin-stats">
                    <AdminStat
                      label="ACTIVE"
                      value={data.adminStats.tournaments.active}
                      accent="#00f0ff"
                    />
                    <AdminStat
                      label="UPCOMING"
                      value={data.adminStats.tournaments.upcoming}
                      accent="#ffd84d"
                    />
                    <AdminStat
                      label="ENDED"
                      value={data.adminStats.tournaments.ended}
                      accent="#555"
                    />
                    <AdminStat
                      label="TOTAL"
                      value={data.adminStats.tournaments.total}
                      accent="#ff2bd6"
                    />
                  </div>
                </div>
                <div className="vt-admin-card">
                  <HudCorners color="#ff2bd6" />
                  <span
                    className="vt-admin-label"
                    style={{ color: "#ff2bd6", textShadow: "0 0 6px #ff2bd6" }}
                  >
                    SUBMISSIONS
                  </span>
                  <div className="vt-admin-stats">
                    <AdminStat
                      label="TOTAL"
                      value={data.adminStats.submissions.total}
                      accent="#00f0ff"
                    />
                    <AdminStat
                      label="PENDING"
                      value={data.adminStats.submissions.pending}
                      accent="#ffd84d"
                    />
                    <AdminStat
                      label="APPROVED"
                      value={data.adminStats.submissions.approved}
                      accent="#4dff91"
                    />
                    <AdminStat
                      label="APPROVE %"
                      value={approvalPct}
                      accent="#ff2bd6"
                      unit="%"
                    />
                  </div>
                </div>
                <div className="vt-admin-card">
                  <HudCorners color="#00f0ff" />
                  <span
                    className="vt-admin-label"
                    style={{ color: "#00f0ff", textShadow: "0 0 6px #00f0ff" }}
                  >
                    PLAYERS
                  </span>
                  <div className="vt-admin-stats">
                    <AdminStat
                      label="TOTAL"
                      value={data.adminStats.users.total}
                      accent="#00f0ff"
                    />
                    <AdminStat
                      label="NEW THIS WK"
                      value={data.adminStats.users.newThisWeek}
                      accent="#ffd84d"
                    />
                    <AdminStat
                      label="TEAMS"
                      value={data.adminStats.teams.total}
                      accent="#ff2bd6"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="vt-footer">
          <span className="vt-footer-text">
            © URBAN LEGENDS ARCADE — PLAY RESPONSIBLY — INSERT COIN TO CONTINUE
          </span>
        </footer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VsStat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: string;
  small?: boolean;
  rival?: boolean;
}) {
  return (
    <div className={`vt-vs-stat${small ? " vt-vs-stat--small" : ""}`}>
      <span className="vt-vs-stat-label">{label}</span>
      <span
        className="vt-vs-stat-value"
        style={accent ? { color: accent, textShadow: `0 0 6px ${accent}` } : {}}
      >
        {value}
      </span>
    </div>
  );
}

function AdminStat({
  label,
  value,
  accent,
  unit = "",
}: {
  label: string;
  value: number;
  accent: string;
  unit?: string;
}) {
  return (
    <div className="vt-admin-stat">
      <span className="vt-admin-stat-label">{label}</span>
      <span
        className="vt-admin-stat-value"
        style={{ color: accent, textShadow: `0 0 6px ${accent}` }}
      >
        {value}
        {unit}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function VariantTStyles() {
  return (
    <style
      // Scoped styles are injected once; dangerouslySetInnerHTML avoids
      // React escaping the CSS string content.
      dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

/* ─── Keyframes ─── */

@keyframes vt-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes vt-glow-pulse-magenta {
  0%, 100% { text-shadow: 0 0 8px #ff2bd6, 0 0 16px #ff2bd666; }
  50% { text-shadow: 0 0 20px #ff2bd6, 0 0 40px #ff2bd6aa, 0 0 60px #ff2bd633; }
}

@keyframes vt-glow-pulse-cyan {
  0%, 100% { text-shadow: 0 0 8px #00f0ff, 0 0 16px #00f0ff66; }
  50% { text-shadow: 0 0 20px #00f0ff, 0 0 40px #00f0ffaa, 0 0 60px #00f0ff33; }
}

@keyframes vt-glow-pulse-amber {
  0%, 100% { text-shadow: 0 0 8px #ffd84d, 0 0 16px #ffd84d66; }
  50% { text-shadow: 0 0 20px #ffd84d, 0 0 40px #ffd84daa, 0 0 60px #ffd84d33; }
}

@keyframes vt-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes vt-bar-grow {
  from { width: 0 !important; }
  to { /* width set via inline style */ }
}

@keyframes vt-fade-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes vt-rank-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes vt-trophy-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

@keyframes vt-press-start-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes vt-border-glow-cycle {
  0%, 100% { box-shadow: 0 0 8px #ff2bd644, inset 0 0 8px #ff2bd611; }
  33% { box-shadow: 0 0 8px #00f0ff44, inset 0 0 8px #00f0ff11; }
  66% { box-shadow: 0 0 8px #ffd84d44, inset 0 0 8px #ffd84d11; }
}

@keyframes vt-scanline-drift {
  from { background-position: 0 0; }
  to { background-position: 0 4px; }
}

/* ─── Root ─── */

.vt-root {
  background: #0b0a14;
  color: #d0cfe8;
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* ─── Hero ─── */

.vt-hero {
  position: relative;
  background: linear-gradient(180deg, #130f24 0%, #0b0a14 100%);
  border-bottom: 2px solid #ff2bd6;
  box-shadow: 0 4px 32px #ff2bd622;
  padding: 2rem 1.5rem 2rem;
  overflow: hidden;
}

.vt-hero-inner {
  max-width: 900px;
  margin: 0 auto;
}

.vt-marquee-wrap {
  overflow: hidden;
  width: 100%;
  margin-bottom: 1.25rem;
  border-top: 1px solid #ff2bd644;
  border-bottom: 1px solid #ff2bd644;
  padding: 4px 0;
}

.vt-marquee-track {
  display: flex;
  white-space: nowrap;
  animation: vt-marquee 18s linear infinite;
}

.vt-marquee-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #ff2bd6;
  text-shadow: 0 0 6px #ff2bd6;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding-right: 0;
  flex-shrink: 0;
}

.vt-hero-credits {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.vt-credits-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #665e8a;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.vt-credits-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.1rem;
  color: #ffd84d;
  text-shadow: 0 0 12px #ffd84d, 0 0 24px #ffd84d88;
}

.vt-hero-title {
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.vt-hero-game-on {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #665e8a;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.vt-hero-name {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(1.4rem, 4vw, 2.2rem);
  color: #00f0ff;
  animation: vt-glow-pulse-cyan 2.5s ease-in-out infinite;
  line-height: 1.4;
}

.vt-press-start {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  color: #ff2bd6;
  animation: vt-press-start-blink 1s steps(1) infinite;
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
}

.vt-hero-hud-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2.5rem;
  margin-top: 1rem;
}

/* ─── HUD Readout ─── */

.vt-hud-readout {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vt-hud-readout-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  color: #4a4270;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.vt-hud-readout-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* ─── Main content ─── */

.vt-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* ─── Section ─── */

.vt-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vt-section-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.vt-section-label-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
}

.vt-section-rule {
  flex: 1;
  height: 1px;
  opacity: 0.4;
}

/* ─── Metric cards ─── */

.vt-metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 720px) {
  .vt-metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 420px) {
  .vt-metrics-row {
    grid-template-columns: 1fr;
  }
}

.vt-metric-card {
  position: relative;
  background: #0f0e1e;
  border: 2px solid transparent;
  padding: 1rem 0.875rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  animation: vt-fade-slide-up 0.4s ease both;
}

.vt-metric-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 currentColor;
}

.vt-metric-top-rule {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 0;
}

.vt-metric-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #4a4270;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.vt-metric-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.4rem;
  line-height: 1.2;
  font-weight: 400;
}

.vt-metric-unit {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  color: #4a4270;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

/* ─── Player count banner ─── */

.vt-player-count-banner {
  position: relative;
  background: #0f0e1e;
  border: 2px solid #00f0ff44;
  padding: 1.25rem 1.5rem;
  animation: vt-fade-slide-up 0.4s ease both;
}

.vt-player-count-inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.vt-player-count-icon {
  flex-shrink: 0;
}

.vt-player-count-text {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.vt-player-count-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 2rem;
  line-height: 1;
}

.vt-player-count-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #4a4270;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.vt-player-count-delta {
  margin-left: auto;
}

.vt-delta-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  animation: vt-glow-pulse-amber 2s ease-in-out infinite;
}

/* ─── MVP card ─── */

.vt-mvp-card {
  position: relative;
  background: linear-gradient(135deg, #130f24 0%, #0f0e1e 100%);
  border: 2px solid #ffd84d44;
  padding: 1.5rem;
  animation: vt-fade-slide-up 0.4s ease both;
  transition: transform 0.15s ease;
}

.vt-mvp-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #ffd84d66;
}

.vt-mvp-inner {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.vt-mvp-trophy {
  flex-shrink: 0;
  animation: vt-trophy-float 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px #ffd84d88);
}

.vt-mvp-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.vt-mvp-ribbon {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  animation: vt-glow-pulse-amber 2s ease-in-out infinite;
}

.vt-mvp-player-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #4a4270;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.vt-mvp-name {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(1rem, 3vw, 1.5rem);
  line-height: 1.3;
  animation: vt-blink 1.8s steps(1) infinite;
}

.vt-mvp-detail {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: #8a82a8;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.6;
  margin: 0;
}

/* ─── Standings table ─── */

.vt-standings-wrap {
  position: relative;
  border: 2px solid #ff2bd644;
  animation: vt-fade-slide-up 0.4s ease both;
  overflow: hidden;
}

.vt-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
}

.vt-table-head-row {
  border-bottom: 2px solid #ff2bd6;
  box-shadow: 0 2px 8px #ff2bd633;
}

.vt-th {
  padding: 0.625rem 0.75rem;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #ff2bd6;
  text-shadow: 0 0 6px #ff2bd6;
  text-align: left;
  font-weight: 700;
  white-space: nowrap;
}

.vt-th--rank {
  width: 3rem;
}

.vt-th--hide-sm {
  /* visible on tablet+ */
}

.vt-table-row {
  border-bottom: 1px solid #ff2bd618;
  animation: vt-fade-slide-up 0.35s ease both;
  transition: transform 0.12s ease, background 0.12s ease;
}

.vt-table-row:hover {
  background: #ff2bd608;
  transform: translateX(2px);
}

.vt-table-row--top {
  background: #ff2bd60a;
}

.vt-td {
  padding: 0.6rem 0.75rem;
  font-size: 0.72rem;
  color: #a09ac0;
  vertical-align: middle;
}

.vt-td--rank {
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  width: 3.5rem;
}

.vt-td--team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.vt-td--tour {
  color: #665e8a;
  font-size: 0.65rem;
}

.vt-td--num {
  text-align: center;
  width: 3rem;
}

.vt-td--pts {
  width: 14rem;
  min-width: 10rem;
}

.vt-td--hide-sm {
  /* visible on tablet+ */
}

.vt-team-name {
  font-size: 0.75rem;
  color: #d0cfe8;
  font-weight: 500;
}

.vt-cap-badge {
  font-size: 0.55rem;
  letter-spacing: 0.15em;
  font-weight: 700;
  padding: 1px 5px;
  border: 1px solid currentColor;
  border-radius: 2px;
  white-space: nowrap;
}

.vt-role-badge {
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: 700;
  white-space: nowrap;
}

.vt-role-badge--captain {
  background: #ffd84d18;
  color: #ffd84d;
  border: 1px solid #ffd84d44;
  text-shadow: 0 0 6px #ffd84d;
}

.vt-role-badge--member {
  background: #00f0ff10;
  color: #00f0ff;
  border: 1px solid #00f0ff30;
}

.vt-rank-cursor {
  color: #ff2bd6;
  text-shadow: 0 0 8px #ff2bd6;
  animation: vt-rank-blink 0.7s steps(1) infinite;
  margin-right: 2px;
  font-size: 0.9rem;
}

.vt-pts-bar-wrap {
  position: relative;
  height: 1.25rem;
  background: #1a1830;
  border: 1px solid #ff2bd622;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.vt-pts-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, #ff2bd688 0%, #ff2bd6 100%);
  box-shadow: 2px 0 8px #ff2bd644;
  animation: vt-bar-grow 0.8s ease both;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.vt-pts-num {
  position: relative;
  z-index: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  padding-left: 6px;
  color: #e0deff;
}

/* ─── VS card ─── */

.vt-vs-card {
  position: relative;
  background: #0f0e1e;
  border: 2px solid #00f0ff30;
  padding: 1.5rem;
  animation: vt-fade-slide-up 0.4s ease both;
}

.vt-vs-columns {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 540px) {
  .vt-vs-columns {
    grid-template-columns: 1fr;
  }
}

.vt-vs-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vt-vs-side-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 700;
}

.vt-vs-team-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #d0cfe8;
  line-height: 1.3;
}

.vt-vs-role {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  color: #665e8a;
  text-transform: uppercase;
}

.vt-vs-divider {
  height: 1px;
  background: #2a2548;
  margin: 0.25rem 0;
}

.vt-vs-stat {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.vt-vs-stat--small .vt-vs-stat-value {
  font-size: 0.62rem !important;
}

.vt-vs-stat-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  color: #4a4270;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  white-space: nowrap;
}

.vt-vs-stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #d0cfe8;
  text-align: right;
}

.vt-vs-divider-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 0;
  min-width: 3rem;
}

.vt-vs-lozenge {
  background: #0b0a14;
  border: 3px solid #ff2bd6;
  box-shadow: 0 0 16px #ff2bd666, inset 0 0 8px #ff2bd622;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
}

.vt-vs-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  transform: rotate(-45deg);
  display: block;
}

.vt-vs-delta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-align: center;
}

.vt-delta-ahead {
  /* color set inline */
}

.vt-delta-behind {
  /* color set inline */
}

/* ─── Lineup list ─── */

.vt-lineup-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.vt-lineup-row {
  position: relative;
  background: #0f0e1e;
  border: 2px solid transparent;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: vt-fade-slide-up 0.35s ease both;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.vt-lineup-row:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #00f0ff44;
}

.vt-lineup-slot {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  flex-shrink: 0;
  width: 2.5rem;
}

.vt-lineup-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.vt-lineup-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  color: #d0cfe8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vt-lineup-tour {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #4a4270;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.vt-lineup-right {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-shrink: 0;
}

.vt-lineup-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 2px;
}

.vt-lineup-badge--captain {
  background: #ffd84d18;
  color: #ffd84d;
  border: 1px solid #ffd84d44;
  text-shadow: 0 0 6px #ffd84d;
}

.vt-lineup-badge--member {
  background: #00f0ff10;
  color: #00f0ff;
  border: 1px solid #00f0ff30;
}

.vt-lineup-pts {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ff2bd6;
  text-shadow: 0 0 6px #ff2bd6;
  letter-spacing: 0.05em;
}

.vt-lineup-members {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #4a4270;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ─── Inbox ─── */

.vt-inbox-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vt-inbox-item {
  position: relative;
  background: #0f0e1e;
  border: 2px solid transparent;
  padding: 1rem;
  animation: vt-fade-slide-up 0.4s ease both;
  transition: transform 0.12s ease;
}

.vt-inbox-item:hover {
  transform: translate(-2px, -2px);
}

.vt-inbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
}

.vt-inbox-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 1px solid currentColor;
  border-radius: 2px;
}

.vt-inbox-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  color: #4a4270;
  letter-spacing: 0.1em;
}

.vt-inbox-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 0.875rem;
}

.vt-inbox-main {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #d0cfe8;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

.vt-inbox-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: #4a4270;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.vt-inbox-actions {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

/* ─── Buttons ─── */

.vt-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  padding: 0.5rem 0.875rem;
  border: 2px solid transparent;
  border-radius: 0;
  cursor: pointer;
  text-transform: uppercase;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
  position: relative;
  top: 0;
}

.vt-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 transparent !important;
}

.vt-btn--accept {
  background: #00f0ff18;
  color: #00f0ff;
  border-color: #00f0ff;
  box-shadow: 0 0 8px #00f0ff44, 3px 3px 0 #00f0ff44;
  text-shadow: 0 0 6px #00f0ff;
}

.vt-btn--accept:hover {
  background: #00f0ff28;
  box-shadow: 0 0 16px #00f0ff66, 3px 3px 0 #00f0ff66;
  transform: translate(-1px, -1px);
}

.vt-btn--reject {
  background: #ff2bd618;
  color: #ff2bd6;
  border-color: #ff2bd6;
  box-shadow: 0 0 8px #ff2bd644, 3px 3px 0 #ff2bd644;
  text-shadow: 0 0 6px #ff2bd6;
}

.vt-btn--reject:hover {
  background: #ff2bd628;
  box-shadow: 0 0 16px #ff2bd666, 3px 3px 0 #ff2bd666;
  transform: translate(-1px, -1px);
}

/* ─── Submissions ─── */

.vt-submissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.vt-sub-item {
  position: relative;
  background: #0f0e1e;
  border: 2px solid #ffd84d22;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: vt-fade-slide-up 0.35s ease both;
  transition: transform 0.12s ease;
}

.vt-sub-item:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #ffd84d33;
}

.vt-sub-status {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  padding: 3px 8px;
  border-radius: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}

.vt-sub-status--pending {
  background: #ffd84d18;
  color: #ffd84d;
  border: 1px solid #ffd84d44;
  text-shadow: 0 0 6px #ffd84d;
  animation: vt-blink 1.4s steps(1) infinite;
}

.vt-sub-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.vt-sub-team {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #d0cfe8;
  letter-spacing: 0.05em;
}

.vt-sub-tour {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #4a4270;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.vt-sub-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #665e8a;
}

/* ─── Deadlines ─── */

.vt-deadlines-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.vt-deadline-item {
  position: relative;
  background: #0f0e1e;
  border: 2px solid #ffd84d22;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: vt-fade-slide-up 0.35s ease both;
  transition: transform 0.12s ease;
}

.vt-deadline-item--urgent {
  border-color: #ff2bd644;
  background: #ff2bd608;
  animation: vt-fade-slide-up 0.35s ease both, vt-border-glow-cycle 2s ease infinite;
}

.vt-deadline-days {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  flex-shrink: 0;
  width: 3rem;
  text-align: center;
}

.vt-deadline-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.vt-deadline-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #d0cfe8;
  letter-spacing: 0.05em;
}

.vt-deadline-warn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  animation: vt-blink 0.8s steps(1) infinite;
}

/* ─── Activity feed ─── */

.vt-activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vt-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.625rem 0.75rem;
  border-left: 2px solid #2a2548;
  animation: vt-fade-slide-up 0.3s ease both;
  transition: border-color 0.15s ease;
}

.vt-activity-item:hover {
  border-left-color: #00f0ff;
}

.vt-activity-dot {
  width: 6px;
  height: 6px;
  border-radius: 0;
  flex-shrink: 0;
  margin-top: 4px;
}

.vt-activity-dot--approved {
  background: #4dff91;
  box-shadow: 0 0 6px #4dff91;
}

.vt-activity-dot--rejected {
  background: #ff2bd6;
  box-shadow: 0 0 6px #ff2bd6;
}

.vt-activity-dot--neutral {
  background: #00f0ff;
  box-shadow: 0 0 6px #00f0ff;
}

.vt-activity-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.vt-activity-desc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #a09ac0;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

.vt-activity-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  color: #4a4270;
  letter-spacing: 0.12em;
}

/* ─── Admin grid ─── */

.vt-admin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .vt-admin-grid {
    grid-template-columns: 1fr;
  }
}

.vt-admin-card {
  position: relative;
  background: #0f0e1e;
  border: 2px solid #ffd84d22;
  padding: 1rem;
  animation: vt-fade-slide-up 0.4s ease both;
  transition: transform 0.12s ease;
}

.vt-admin-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #ffd84d33;
}

.vt-admin-label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 0.875rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #2a2548;
}

.vt-admin-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vt-admin-stat {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.vt-admin-stat-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #4a4270;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.vt-admin-stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* ─── Empty state ─── */

.vt-empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: #4a4270;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 1rem;
  text-align: center;
  border: 1px dashed #2a2548;
}

/* ─── Footer ─── */

.vt-footer {
  border-top: 2px solid #ff2bd633;
  padding: 1rem 1.5rem;
  text-align: center;
}

.vt-footer-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  color: #2e2b48;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* ─── Responsive table hide ─── */

@media (max-width: 600px) {
  .vt-td--hide-sm,
  .vt-th--hide-sm {
    display: none;
  }
}
        `,
      }}
    />
  );
}
