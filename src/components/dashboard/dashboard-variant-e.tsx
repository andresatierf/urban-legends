"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

/**
 * Variant E — Aurora Glass (Dark Editorial Luxury)
 *
 * The dashboard is a quiet, atmospheric surface: pure dark navy with a
 * soft aurora gradient mesh, faint noise, and frosted glass cards. A
 * single oversized serif italic anchors the page; everything else is
 * whisper-thin sans + mono meta. Progress is rendered as glowing arcs
 * and constellations rather than bars.
 */
export function DashboardVariantE({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);
  const activeTeams = data.teams.filter(
    (t) => t.tournament.startDate <= today && t.tournament.endDate >= today,
  );
  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Late night"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  // Composite "presence" — share of progress across all active teams
  const presence =
    activeTeams.length === 0
      ? 0
      : Math.round(
          (activeTeams.reduce(
            (sum, t) => sum + tournamentProgress(t.tournament),
            0,
          ) /
            activeTeams.length) *
            100,
        );

  // League standings
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

  // Top rival (tale of the tape)
  const sortedTeams = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const userTop = sortedTeams[0];
  const rival = sortedTeams[1];

  // Metric cards
  const nowMs = Date.now();
  const sevenDaysAgo = nowMs - 7 * 86_400_000;
  const recentActivities = data.activities.filter(
    (a) => a.timestamp >= sevenDaysAgo,
  );
  const activeDays = new Set(
    recentActivities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = activeDays.size;
  const todayApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      new Date(a.timestamp).toISOString().slice(0, 10) === today,
  ).length;
  const weekApproved = data.activities.filter(
    (a) => a.type === "submission_approved" && a.timestamp >= sevenDaysAgo,
  ).length;
  const squadRank = userTop
    ? standings.findIndex((t) => t.team._id === userTop.team._id) + 1
    : 1;
  const sparkline = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nowMs - (6 - i) * 86_400_000).toISOString().slice(0, 10);
    return activeDays.has(d) ? 1 : 0;
  });

  return (
    <>
      <VariantEStyles />
      <div className="variant-e">
        <div className="ve-stage">
          {/* Aurora background */}
          <div className="ve-aurora" aria-hidden>
            <span className="ve-blob ve-blob--teal" />
            <span className="ve-blob ve-blob--magenta" />
            <span className="ve-blob ve-blob--indigo" />
          </div>
          <div className="ve-grain" aria-hidden />

          <div className="ve-content">
            {/* Header */}
            <header className="ve-header">
              <div className="ve-eyebrow">
                <span className="ve-dot" />
                <span>DASHBOARD · {today}</span>
                <span className="ve-eyebrow-sep">/</span>
                <span className="ve-eyebrow-fade">
                  {data.isAdmin ? "ADMIN PRESENCE" : "MEMBER PRESENCE"}
                </span>
              </div>
              <h1 className="ve-title">
                {greeting}, <em>{data.userName}</em>.
              </h1>
              <p className="ve-subtitle">
                {activeTeams.length}{" "}
                {plural(activeTeams.length, "active tournament")}{" "}
                {pendingPhrase(
                  data.pendingSubmissionsCount,
                  data.invitationsCount + data.joinRequests.length,
                )}
              </p>
            </header>

            {/* Hero ring + lanes */}
            <section className="ve-hero">
              <div className="ve-ring-wrap">
                <PresenceRing
                  presence={presence}
                  activeTeams={activeTeams}
                  label="PRESENCE"
                />
              </div>

              <div className="ve-lanes">
                <Lane
                  label="TEAMS"
                  value={data.teams.length}
                  accent="teal"
                  hint={`${data.teams.filter((t) => t.userRole === "captain").length} as captain`}
                />
                <Lane
                  label="PENDING"
                  value={data.pendingSubmissionsCount}
                  accent="magenta"
                  hint={
                    data.pendingSubmissionsCount > 0
                      ? "awaiting review"
                      : "none queued"
                  }
                />
                <Lane
                  label="INBOX"
                  value={data.invitationsCount + data.joinRequests.length}
                  accent="indigo"
                  hint={`${data.invitationsCount} inv · ${data.joinRequests.length} req`}
                />
                {data.isAdmin && data.adminStats && (
                  <Lane
                    label="QUEUE"
                    value={data.adminStats.submissions.pending}
                    accent="teal"
                    hint={`${data.adminStats.users.total} members`}
                  />
                )}
              </div>
            </section>

            {/* Admin manifest */}
            {data.isAdmin && data.adminStats && (
              <section className="ve-manifest">
                <div className="ve-card ve-card--glass">
                  <div className="ve-card-flag">
                    <span className="ve-card-flag-dot" />
                    <span>ADMIN · PLATFORM MANIFEST</span>
                  </div>
                  <div className="ve-manifest-grid">
                    <Manifest
                      label="Members"
                      value={data.adminStats.users.total}
                      delta={`+${data.adminStats.users.newThisWeek}`}
                    />
                    <Manifest
                      label="Active"
                      value={data.adminStats.tournaments.active}
                      delta={`${data.adminStats.tournaments.upcoming} upcoming`}
                    />
                    <Manifest
                      label="Teams"
                      value={data.adminStats.teams.total}
                    />
                    <Manifest
                      label="Approval"
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
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Constellations + Codex */}
            <section className="ve-twocol">
              <div className="ve-constellations">
                <SectionTitle
                  eyebrow="01"
                  title="Constellations"
                  subtitle="Each team, each tournament, where you stand."
                />
                <div className="ve-team-list">
                  {data.teams.map((t) => (
                    <Constellation key={t.team._id} team={t} />
                  ))}
                </div>
              </div>

              <div className="ve-codex">
                <SectionTitle
                  eyebrow="02"
                  title="Codex"
                  subtitle="Items that want your attention."
                />
                <div className="ve-codex-stack">
                  {data.invitations.map((inv) => (
                    <CodexCard
                      key={inv.id}
                      kind="Invitation"
                      accent="magenta"
                      title={inv.teamName}
                      meta={`${inv.invitedBy} · ${inv.tournamentName}`}
                      time={formatRelative(inv.timestamp)}
                      primary="enchanted"
                      secondary="with regrets"
                    />
                  ))}
                  {data.joinRequests.map((jr) => (
                    <CodexCard
                      key={jr.id}
                      kind="Join request"
                      accent="teal"
                      title={jr.userName}
                      meta={`wants to join ${jr.teamName}`}
                      time={formatRelative(jr.timestamp)}
                      primary="welcome"
                      secondary="not today"
                    />
                  ))}
                  {data.pendingSubmissions.map((s) => (
                    <CodexCard
                      key={s.id}
                      kind="Submission"
                      accent="indigo"
                      title={s.teamName}
                      meta={`${s.tournamentName} · ${s.date}`}
                      time="pending"
                      muted
                    />
                  ))}
                  {data.deadlines.map((d) => (
                    <CodexCard
                      key={d.tournament._id}
                      kind="Deadline"
                      accent={d.daysUntilEnd <= 3 ? "magenta" : "indigo"}
                      title={d.tournament.name}
                      meta={`closes in ${d.daysUntilEnd} day${d.daysUntilEnd === 1 ? "" : "s"}`}
                      time={`${d.daysUntilEnd}d`}
                    />
                  ))}
                  {data.invitations.length === 0 &&
                    data.joinRequests.length === 0 &&
                    data.pendingSubmissions.length === 0 &&
                    data.deadlines.length === 0 && (
                      <div className="ve-card ve-card--empty">
                        <p>Nothing waiting. The signal is clear.</p>
                      </div>
                    )}
                </div>
              </div>
            </section>

            {/* Metric cards */}
            <section className="ve-metrics">
              <SectionTitle
                eyebrow="03"
                title="Signal"
                subtitle="Seven-day pulse across your activity."
              />
              <div className="ve-metrics-grid">
                <MetricCard
                  label="Streak"
                  value={streakDays}
                  unit="days"
                  accent="teal"
                  sparkline={sparkline}
                />
                <MetricCard
                  label="This week"
                  value={weekApproved}
                  unit="approved"
                  accent="indigo"
                  sparkline={sparkline}
                />
                <MetricCard
                  label="Today"
                  value={todayApproved}
                  unit="logged"
                  accent="magenta"
                  sparkline={sparkline}
                />
                <MetricCard
                  label="Squad rank"
                  value={squadRank}
                  unit={`of ${data.teams.length}`}
                  accent="teal"
                  sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
                />
              </div>
            </section>

            {/* Team of the Day */}
            <section className="ve-mvp">
              <SectionTitle
                eyebrow="04"
                title="Distinction"
                subtitle="Squad of the Day."
              />
              {mvpTeam ? (
                <div className="ve-mvp-card ve-card ve-card--glass">
                  <div className="ve-mvp-glow" aria-hidden />
                  <div className="ve-mvp-trophy" aria-hidden>
                    <TrophySvg />
                  </div>
                  <div className="ve-mvp-body">
                    <span className="ve-mvp-ribbon">Squad of the Day</span>
                    <h3 className="ve-mvp-name">{mvpTeam.team.name}</h3>
                    <p className="ve-mvp-detail">
                      <em>{mvpTeam.tournament.name}</em> · {mvpDisplayCount}{" "}
                      submission{mvpDisplayCount === 1 ? "" : "s"}{" "}
                      {mvpCountToday > 0 ? "today" : "this period"}
                      {mvpTeam.memberCount > 0 && (
                        <>
                          {" "}
                          · {mvpTeam.memberCount} member
                          {mvpTeam.memberCount === 1 ? "" : "s"}
                        </>
                      )}
                      {mvpTeam.userRole === "captain" && (
                        <>
                          {" "}
                          · <em>you captain this squad</em>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="ve-card ve-card--empty">
                  <p>No squads on the board yet.</p>
                </div>
              )}
            </section>

            {/* League standings */}
            <section className="ve-standings">
              <SectionTitle
                eyebrow="05"
                title="League"
                subtitle="Standings across all your tournaments."
              />
              <div className="ve-card ve-card--glass ve-standings-wrap">
                <table className="ve-table">
                  <thead>
                    <tr>
                      <th style={{ width: "3rem" }}>#</th>
                      <th>Team</th>
                      <th>Tournament</th>
                      <th style={{ width: "5.5rem" }}>Role</th>
                      <th style={{ width: "4rem" }}>Mbr</th>
                      <th style={{ width: "16rem" }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((t, i) => (
                      <tr key={t.team._id} className="ve-table-row">
                        <td className="ve-td-rank">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="ve-td-team">
                          <span className="ve-td-team-name">{t.team.name}</span>
                          {t.userRole === "captain" && (
                            <span className="ve-c-cap">captain</span>
                          )}
                        </td>
                        <td className="ve-td-tour">{t.tournament.name}</td>
                        <td>
                          <span className="ve-td-role">
                            {t.userRole.toUpperCase()}
                          </span>
                        </td>
                        <td className="ve-td-num">
                          {t.memberCount.toString().padStart(2, "0")}
                        </td>
                        <td>
                          <div className="ve-pts-bar">
                            <div
                              className="ve-pts-fill"
                              style={{
                                width: `${(t.team.points / maxPts) * 100}%`,
                              }}
                            />
                            <span className="ve-pts-num">
                              {t.team.points.toString().padStart(4, "0")}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tale of the tape */}
            {userTop && rival && (
              <section className="ve-tape">
                <SectionTitle
                  eyebrow="06"
                  title="Duel"
                  subtitle="You versus your closest rival."
                />
                <div className="ve-tape-card ve-card ve-card--glass">
                  <TapeColumn team={userTop} side="left" />
                  <div className="ve-tape-center">
                    <div className="ve-tape-divider" aria-hidden />
                    {userTop.team.points >= rival.team.points ? (
                      <span className="ve-tape-delta ve-tape-delta--ahead">
                        ahead by {userTop.team.points - rival.team.points}
                      </span>
                    ) : (
                      <span className="ve-tape-delta ve-tape-delta--behind">
                        behind by {rival.team.points - userTop.team.points}
                      </span>
                    )}
                  </div>
                  <TapeColumn team={rival} side="right" label="Rival" />
                </div>
              </section>
            )}

            {/* Today's lineup */}
            <section className="ve-lineup">
              <SectionTitle
                eyebrow="07"
                title="Lineup"
                subtitle="Your full roster."
              />
              <div className="ve-card ve-card--glass ve-lineup-list">
                {data.teams.map((t, i) => (
                  <div key={t.team._id} className="ve-lineup-row">
                    <span className="ve-lineup-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="ve-lineup-name">{t.team.name}</span>
                    <span className="ve-lineup-role">
                      {t.userRole.toUpperCase()}
                    </span>
                    <span className="ve-lineup-pts">
                      {t.team.points}{" "}
                      <span className="ve-lineup-pts-unit">pts</span>
                    </span>
                    <span className="ve-lineup-mbr">
                      {t.memberCount.toString().padStart(2, "0")} members
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Transmissions */}
            <section className="ve-transmissions">
              <SectionTitle
                eyebrow="08"
                title="Transmissions"
                subtitle="What's moved across the platform."
              />
              <ol className="ve-feed">
                {data.activities.map((a, i) => (
                  <li key={i} className="ve-feed-row">
                    <span className="ve-feed-time">
                      {formatRelative(a.timestamp)}
                    </span>
                    <span className="ve-feed-line" aria-hidden />
                    <span className="ve-feed-body">{a.description}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function plural(n: number, word: string) {
  return n === 1 ? word : `${word}s`;
}
function pendingPhrase(pending: number, inbox: number) {
  if (pending === 0 && inbox === 0) return "· nothing waiting on you.";
  const parts: string[] = [];
  if (pending > 0) parts.push(`${pending} pending`);
  if (inbox > 0) parts.push(`${inbox} in your inbox`);
  return `· ${parts.join(" · ")}.`;
}

type TeamItem = DashboardFixtureData["teams"][number];

function tournamentProgress(t: TeamItem["tournament"]) {
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function PresenceRing({
  presence,
  activeTeams,
  label,
}: {
  presence: number;
  activeTeams: TeamItem[];
  label: string;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 96;
  const circ = 2 * Math.PI * r;
  // segment for each team
  const seg = activeTeams.length > 0 ? 1 / activeTeams.length : 0;
  const palette = ["#6fffd4", "#ff6fb4", "#8b6fff", "#6fb4ff"];

  return (
    <svg
      className="ve-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <defs>
        <radialGradient id="ve-ring-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="60%" stopColor="rgba(111,255,212,0)" />
          <stop offset="100%" stopColor="rgba(111,255,212,0.18)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 18} fill="url(#ve-ring-glow)" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1.2}
      />
      {activeTeams.map((t, i) => {
        const progress = tournamentProgress(t.tournament);
        const arcLen = seg * circ * progress;
        const gap = seg * circ - arcLen;
        const rot = i * seg * 360 - 90;
        return (
          <circle
            key={t.team._id}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={palette[i % palette.length]}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${gap} 0 ${(1 - seg) * circ}`}
            transform={`rotate(${rot} ${cx} ${cy})`}
            style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
          />
        );
      })}
      {/* Tick marks */}
      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * 2 * Math.PI - Math.PI / 2;
        const r1 = r + 14;
        const r2 = r + 18;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="ve-ring-label">
        {label}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" className="ve-ring-value">
        {presence}
        <tspan className="ve-ring-unit">%</tspan>
      </text>
      <text x={cx} y={cy + 50} textAnchor="middle" className="ve-ring-sub">
        across {activeTeams.length} {plural(activeTeams.length, "tournament")}
      </text>
    </svg>
  );
}

function Lane({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent: "teal" | "magenta" | "indigo";
  hint: string;
}) {
  return (
    <div className={`ve-lane ve-lane--${accent}`}>
      <span className="ve-lane-label">{label}</span>
      <span className="ve-lane-value">{value}</span>
      <span className="ve-lane-hint">{hint}</span>
    </div>
  );
}

function Manifest({
  label,
  value,
  delta,
  unit,
}: {
  label: string;
  value: number;
  delta?: string;
  unit?: string;
}) {
  return (
    <div className="ve-manifest-tile">
      <span className="ve-manifest-label">{label}</span>
      <span className="ve-manifest-value">
        {value}
        {unit && <span className="ve-manifest-unit">{unit}</span>}
      </span>
      {delta && <span className="ve-manifest-delta">{delta}</span>}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="ve-section-title">
      <span className="ve-section-eyebrow">{eyebrow}</span>
      <h2 className="ve-section-h">{title}</h2>
      <p className="ve-section-sub">{subtitle}</p>
    </div>
  );
}

function Constellation({ team }: { team: TeamItem }) {
  const progress = Math.max(
    0,
    Math.min(1, tournamentProgress(team.tournament)),
  );
  return (
    <div className="ve-card ve-card--glass ve-constellation">
      <div className="ve-c-head">
        <div>
          <h3 className="ve-c-team">
            {team.team.name}
            {team.userRole === "captain" && (
              <span className="ve-c-cap">captain</span>
            )}
          </h3>
          <p className="ve-c-tour">{team.tournament.name}</p>
        </div>
        <div className="ve-c-meta">
          <span className="ve-c-pts">{team.team.points}</span>
          <span className="ve-c-pts-label">pts</span>
        </div>
      </div>
      <div className="ve-c-track">
        <div className="ve-c-line" />
        <div className="ve-c-fill" style={{ width: `${progress * 100}%` }} />
        {Array.from({ length: 5 }).map((_, i) => {
          const at = i / 4;
          const lit = at <= progress;
          return (
            <span
              key={i}
              className={`ve-c-star ${lit ? "ve-c-star--lit" : ""}`}
              style={{ left: `${at * 100}%` }}
              aria-hidden
            />
          );
        })}
      </div>
      <div className="ve-c-foot">
        <span>{Math.round(progress * 100)}% elapsed</span>
        <span>{team.memberCount} members</span>
        <span>ends {team.tournament.endDate}</span>
      </div>
    </div>
  );
}

function CodexCard({
  kind,
  accent,
  title,
  meta,
  time,
  primary,
  secondary,
  muted,
}: {
  kind: string;
  accent: "teal" | "magenta" | "indigo";
  title: string;
  meta: string;
  time: string;
  primary?: string;
  secondary?: string;
  muted?: boolean;
}) {
  return (
    <article
      className={`ve-card ve-card--glass ve-codex-card ve-codex-card--${accent} ${muted ? "ve-codex-card--muted" : ""}`}
    >
      <header className="ve-cx-head">
        <span className="ve-cx-kind">
          <span className="ve-cx-dot" /> {kind}
        </span>
        <span className="ve-cx-time">{time}</span>
      </header>
      <h4 className="ve-cx-title">{title}</h4>
      <p className="ve-cx-meta">{meta}</p>
      {(primary || secondary) && (
        <footer className="ve-cx-actions">
          {primary && (
            <button className="ve-btn ve-btn--primary">{primary}</button>
          )}
          {secondary && <button className="ve-btn">{secondary}</button>}
        </footer>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// New subcomponents
// ---------------------------------------------------------------------------

function TrophySvg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M14 6h20v14c0 7.732-4.477 14-10 14S14 27.732 14 20V6z"
        stroke="#ffd28a"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(255,210,138,0.08)"
      />
      <path
        d="M14 10H8a4 4 0 0 0 4 4h2M34 10h6a4 4 0 0 1-4 4h-2"
        stroke="#ffd28a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 34v6M17 40h14"
        stroke="#ffd28a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="22" r="2.5" fill="#ffd28a" opacity="0.7" />
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
  accent: "teal" | "magenta" | "indigo";
  sparkline: number[];
}) {
  const accentColors = {
    teal: "var(--ve-teal)",
    magenta: "var(--ve-magenta)",
    indigo: "var(--ve-indigo)",
  };
  const color = accentColors[accent];
  const max = Math.max(...sparkline, 1);
  return (
    <div
      className={`ve-metric-card ve-card ve-card--glass ve-metric-card--${accent}`}
    >
      <div className="ve-metric-accent-rule" style={{ background: color }} />
      <span className="ve-metric-label">{label.toUpperCase()}</span>
      <span className="ve-metric-value">{value}</span>
      <span className="ve-metric-unit">{unit.toUpperCase()}</span>
      <svg
        className="ve-sparkline"
        width="100%"
        height="24"
        viewBox={`0 0 ${sparkline.length * 10} 24`}
        preserveAspectRatio="none"
      >
        {sparkline.map((v, i) => {
          const x = i * 10 + 5;
          const h = Math.round((v / max) * 18);
          return (
            <rect
              key={i}
              x={x - 3}
              y={24 - h}
              width={6}
              height={h}
              rx={2}
              fill={color}
              opacity={0.6}
            />
          );
        })}
      </svg>
    </div>
  );
}

function TapeColumn({
  team,
  side,
  label,
}: {
  team: TeamItem;
  side: "left" | "right";
  label?: string;
}) {
  const progress = Math.max(
    0,
    Math.min(1, tournamentProgress(team.tournament)),
  );
  return (
    <div className={`ve-tape-col ve-tape-col--${side}`}>
      {label && (
        <span className="ve-tape-col-label">{label.toUpperCase()}</span>
      )}
      <h4 className="ve-tape-name">{team.team.name}</h4>
      {team.userRole === "captain" && <span className="ve-c-cap">captain</span>}
      <div className="ve-tape-stat">
        <span className="ve-tape-stat-num">{team.memberCount}</span>
        <span className="ve-tape-stat-unit">members</span>
      </div>
      <div className="ve-tape-stat">
        <span className="ve-tape-stat-num">{team.team.points}</span>
        <span className="ve-tape-stat-unit">pts</span>
      </div>
      <div className="ve-tape-progress">
        <div className="ve-tape-progress-track">
          <div
            className="ve-tape-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="ve-tape-progress-pct">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function VariantEStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,500&family=Geist:wght@300;400;500;700&family=Geist+Mono:wght@400;500&display=swap');

        .variant-e {
          --ve-bg: #07080d;
          --ve-bg-2: #0c0f17;
          --ve-text: #eef0f7;
          --ve-mute: rgba(238,240,247,0.55);
          --ve-mute-2: rgba(238,240,247,0.32);
          --ve-line: rgba(255,255,255,0.08);
          --ve-line-strong: rgba(255,255,255,0.16);
          --ve-glass: rgba(255,255,255,0.035);
          --ve-glass-2: rgba(255,255,255,0.06);
          --ve-teal: #6fffd4;
          --ve-magenta: #ff6fb4;
          --ve-indigo: #8b6fff;
          --ve-amber: #ffd28a;
          font-family: 'Geist', system-ui, sans-serif;
          color: var(--ve-text);
          font-weight: 300;
        }

        .ve-stage {
          position: relative;
          background: var(--ve-bg);
          border-radius: 18px;
          overflow: hidden;
          isolation: isolate;
          border: 1px solid var(--ve-line);
        }

        /* Aurora -------------------------------------------------------- */
        .ve-aurora {
          position: absolute;
          inset: -10%;
          z-index: 0;
          pointer-events: none;
        }
        .ve-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.55;
          mix-blend-mode: screen;
        }
        .ve-blob--teal {
          width: 520px; height: 520px;
          top: -10%; left: -10%;
          background: radial-gradient(circle, var(--ve-teal) 0%, transparent 60%);
          animation: ve-drift1 22s ease-in-out infinite alternate;
        }
        .ve-blob--magenta {
          width: 600px; height: 600px;
          top: 10%; right: -15%;
          background: radial-gradient(circle, var(--ve-magenta) 0%, transparent 60%);
          animation: ve-drift2 28s ease-in-out infinite alternate;
        }
        .ve-blob--indigo {
          width: 520px; height: 520px;
          bottom: -15%; left: 30%;
          background: radial-gradient(circle, var(--ve-indigo) 0%, transparent 60%);
          animation: ve-drift3 26s ease-in-out infinite alternate;
        }
        @keyframes ve-drift1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(40px, 50px) scale(1.08); }
        }
        @keyframes ve-drift2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-60px, 40px) scale(0.95); }
        }
        @keyframes ve-drift3 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(30px, -40px) scale(1.05); }
        }
        .ve-grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.14;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        .ve-content {
          position: relative;
          z-index: 2;
          padding: 3rem 2.5rem 2.5rem;
        }

        /* Header --------------------------------------------------------- */
        .ve-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ve-mute);
        }
        .ve-eyebrow-sep { opacity: 0.4; }
        .ve-eyebrow-fade { color: var(--ve-mute-2); }
        .ve-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--ve-teal);
          box-shadow: 0 0 8px var(--ve-teal);
          animation: ve-pulse 2.6s ease-in-out infinite;
        }
        @keyframes ve-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .ve-title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: clamp(2.4rem, 5.5vw, 4.4rem);
          letter-spacing: -0.025em;
          line-height: 1.05;
          margin: 0.6rem 0 0.3rem;
        }
        .ve-title em {
          font-style: italic;
          font-weight: 500;
          background: linear-gradient(90deg, var(--ve-teal), var(--ve-indigo) 60%, var(--ve-magenta));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ve-subtitle {
          font-size: 0.95rem;
          color: var(--ve-mute);
          margin: 0;
          letter-spacing: 0.01em;
        }

        /* Hero ----------------------------------------------------------- */
        .ve-hero {
          margin-top: 2rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.4rem;
          align-items: center;
        }
        @media (min-width: 900px) {
          .ve-hero { grid-template-columns: 280px 1fr; }
        }
        .ve-ring-wrap {
          display: flex;
          justify-content: center;
        }
        .ve-ring-label {
          fill: var(--ve-mute);
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
        }
        .ve-ring-value {
          fill: var(--ve-text);
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 2.4rem;
          font-variant-numeric: tabular-nums;
        }
        .ve-ring-unit {
          font-size: 1.1rem;
          fill: var(--ve-mute);
        }
        .ve-ring-sub {
          fill: var(--ve-mute);
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .ve-lanes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
        }
        @media (min-width: 700px) {
          .ve-lanes { grid-template-columns: repeat(4, 1fr); }
        }
        .ve-lane {
          background: var(--ve-glass);
          border: 1px solid var(--ve-line);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 1rem 1rem 1.1rem;
          border-radius: 14px;
          position: relative;
          overflow: hidden;
        }
        .ve-lane::before {
          content: '';
          position: absolute;
          inset: 0 auto auto 0;
          width: 100%;
          height: 2px;
          background: currentColor;
          opacity: 0.5;
        }
        .ve-lane--teal { color: var(--ve-teal); }
        .ve-lane--magenta { color: var(--ve-magenta); }
        .ve-lane--indigo { color: var(--ve-indigo); }
        .ve-lane-label {
          display: block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ve-mute);
        }
        .ve-lane-value {
          display: block;
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 2.6rem;
          line-height: 1;
          letter-spacing: -0.02em;
          color: var(--ve-text);
          margin: 0.3rem 0 0.2rem;
          font-variant-numeric: tabular-nums;
        }
        .ve-lane-hint {
          display: block;
          font-size: 0.74rem;
          color: var(--ve-mute);
          letter-spacing: 0.01em;
        }

        /* Card base ------------------------------------------------------ */
        .ve-card {
          border-radius: 14px;
          padding: 1.1rem 1.2rem;
        }
        .ve-card--glass {
          background: var(--ve-glass);
          border: 1px solid var(--ve-line);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 60px -30px rgba(0,0,0,0.6);
        }
        .ve-card--empty { color: var(--ve-mute); text-align: center; padding: 2rem; }
        .ve-card-flag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Geist Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ve-mute);
          margin-bottom: 0.85rem;
        }
        .ve-card-flag-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--ve-amber);
          box-shadow: 0 0 8px var(--ve-amber);
        }

        /* Manifest ------------------------------------------------------- */
        .ve-manifest { margin-top: 1.6rem; }
        .ve-manifest-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
        }
        @media (min-width: 700px) {
          .ve-manifest-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .ve-manifest-tile {
          padding: 0.4rem 1rem;
          border-left: 1px solid var(--ve-line);
        }
        .ve-manifest-tile:first-child { border-left: none; padding-left: 0; }
        .ve-manifest-label {
          display: block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ve-mute);
        }
        .ve-manifest-value {
          display: block;
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 1.9rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0.2rem 0 0.05rem;
          font-variant-numeric: tabular-nums;
        }
        .ve-manifest-unit { font-size: 0.85rem; color: var(--ve-mute); }
        .ve-manifest-delta {
          display: block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.68rem;
          color: var(--ve-mute);
          letter-spacing: 0.05em;
        }

        /* Two col -------------------------------------------------------- */
        .ve-twocol {
          margin-top: 2.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.6rem;
        }
        @media (min-width: 900px) {
          .ve-twocol { grid-template-columns: 1.25fr 1fr; }
        }
        .ve-section-title { margin-bottom: 1rem; }
        .ve-section-eyebrow {
          display: inline-block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          color: var(--ve-mute);
          margin-bottom: 0.3rem;
        }
        .ve-section-h {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-style: italic;
          font-size: 1.8rem;
          letter-spacing: -0.015em;
          margin: 0;
        }
        .ve-section-sub {
          font-size: 0.85rem;
          color: var(--ve-mute);
          margin: 0.15rem 0 0;
        }

        /* Constellation -------------------------------------------------- */
        .ve-team-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .ve-c-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 1.1rem;
        }
        .ve-c-team {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          font-size: 1.25rem;
          letter-spacing: -0.01em;
          margin: 0;
          line-height: 1.2;
        }
        .ve-c-cap {
          margin-left: 0.5rem;
          font-family: 'Geist Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ve-amber);
          padding: 0.1rem 0.35rem;
          border: 1px solid rgba(255,210,138,0.4);
          border-radius: 999px;
          vertical-align: middle;
        }
        .ve-c-tour {
          font-size: 0.85rem;
          color: var(--ve-mute);
          margin: 0.15rem 0 0;
        }
        .ve-c-meta { text-align: right; }
        .ve-c-pts {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 1.8rem;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .ve-c-pts-label {
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          color: var(--ve-mute);
          margin-left: 0.3rem;
        }
        .ve-c-track {
          position: relative;
          height: 22px;
          margin: 0.6rem 0 0.85rem;
        }
        .ve-c-line {
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: var(--ve-line-strong);
          transform: translateY(-50%);
        }
        .ve-c-fill {
          position: absolute;
          top: 50%; left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--ve-teal), var(--ve-indigo));
          transform: translateY(-50%);
          box-shadow: 0 0 12px rgba(111,255,212,0.45);
        }
        .ve-c-star {
          position: absolute;
          top: 50%;
          width: 9px; height: 9px;
          border-radius: 50%;
          background: var(--ve-bg-2);
          border: 1px solid var(--ve-line-strong);
          transform: translate(-50%, -50%);
        }
        .ve-c-star--lit {
          background: var(--ve-teal);
          border-color: var(--ve-teal);
          box-shadow: 0 0 10px var(--ve-teal);
        }
        .ve-c-foot {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          color: var(--ve-mute);
          letter-spacing: 0.05em;
        }

        /* Codex ---------------------------------------------------------- */
        .ve-codex-stack {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .ve-codex-card {
          border-left: 2px solid currentColor;
          padding: 0.85rem 1rem;
        }
        .ve-codex-card--teal { color: var(--ve-teal); }
        .ve-codex-card--magenta { color: var(--ve-magenta); }
        .ve-codex-card--indigo { color: var(--ve-indigo); }
        .ve-codex-card--muted { color: var(--ve-mute-2); }
        .ve-cx-head {
          display: flex;
          justify-content: space-between;
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .ve-cx-kind { display: flex; align-items: center; gap: 0.4rem; color: currentColor; }
        .ve-cx-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 6px currentColor;
        }
        .ve-cx-time { color: var(--ve-mute); }
        .ve-cx-title {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          color: var(--ve-text);
          font-size: 1.05rem;
          letter-spacing: -0.01em;
          margin: 0.25rem 0 0.15rem;
        }
        .ve-cx-meta {
          color: var(--ve-mute);
          font-size: 0.82rem;
          margin: 0;
        }
        .ve-cx-actions {
          display: flex;
          gap: 0.45rem;
          margin-top: 0.75rem;
        }
        .ve-btn {
          background: transparent;
          color: var(--ve-text);
          border: 1px solid var(--ve-line-strong);
          border-radius: 999px;
          padding: 0.3rem 0.8rem;
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 160ms ease;
        }
        .ve-btn:hover { background: var(--ve-glass-2); }
        .ve-btn--primary {
          background: var(--ve-text);
          color: var(--ve-bg);
          border-color: var(--ve-text);
        }
        .ve-btn--primary:hover { background: var(--ve-teal); border-color: var(--ve-teal); }

        /* Metric cards --------------------------------------------------- */
        .ve-metrics { margin-top: 2.5rem; }
        .ve-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
        }
        @media (min-width: 700px) {
          .ve-metrics-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .ve-metric-card {
          position: relative;
          padding: 1.1rem 1.1rem 0.9rem;
          overflow: hidden;
        }
        .ve-metric-accent-rule {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          opacity: 0.8;
        }
        .ve-metric-card--teal { border-color: rgba(111,255,212,0.2); }
        .ve-metric-card--magenta { border-color: rgba(255,111,180,0.2); }
        .ve-metric-card--indigo { border-color: rgba(139,111,255,0.2); }
        .ve-metric-label {
          display: block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          color: var(--ve-mute);
        }
        .ve-metric-value {
          display: block;
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 2.2rem;
          line-height: 1.05;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          margin: 0.2rem 0 0;
        }
        .ve-metric-unit {
          display: block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          color: var(--ve-mute);
          margin-bottom: 0.5rem;
        }
        .ve-sparkline { display: block; width: 100%; }

        /* MVP ------------------------------------------------------------ */
        .ve-mvp { margin-top: 2.5rem; }
        .ve-mvp-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1.6rem;
          padding: 1.6rem 1.8rem;
          overflow: hidden;
        }
        .ve-mvp-glow {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle at 30% 50%, rgba(255,210,138,0.12), transparent 60%);
          pointer-events: none;
        }
        .ve-mvp-trophy { flex-shrink: 0; }
        .ve-mvp-body { flex: 1; min-width: 0; }
        .ve-mvp-ribbon {
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ve-amber);
        }
        .ve-mvp-name {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-style: italic;
          font-size: 2rem;
          letter-spacing: -0.02em;
          margin: 0.2rem 0 0.4rem;
          background: linear-gradient(90deg, var(--ve-amber), var(--ve-indigo));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ve-mvp-detail {
          font-size: 0.9rem;
          color: var(--ve-mute);
          margin: 0;
        }
        .ve-mvp-detail em {
          font-style: normal;
          color: var(--ve-text);
        }

        /* League standings ----------------------------------------------- */
        .ve-standings { margin-top: 2.5rem; }
        .ve-standings-wrap { padding: 0; overflow: hidden; }
        .ve-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .ve-table thead tr {
          border-bottom: 1px solid rgba(255,210,138,0.2);
        }
        .ve-table th {
          font-family: 'Geist Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ve-mute);
          font-weight: 400;
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .ve-table-row {
          border-bottom: 1px solid var(--ve-line);
          background: linear-gradient(90deg, rgba(139,111,255,0.03), rgba(111,255,212,0.02));
          transition: background 160ms ease;
        }
        .ve-table-row:last-child { border-bottom: none; }
        .ve-table-row:hover {
          background: linear-gradient(90deg, rgba(139,111,255,0.07), rgba(111,255,212,0.05));
        }
        .ve-table td {
          padding: 0.75rem 1rem;
          vertical-align: middle;
        }
        .ve-td-rank {
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          color: var(--ve-mute);
          letter-spacing: 0.1em;
        }
        .ve-td-team { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .ve-td-team-name {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          font-size: 1rem;
        }
        .ve-td-tour { color: var(--ve-mute); font-size: 0.82rem; }
        .ve-td-role {
          font-family: 'Geist Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          color: var(--ve-indigo);
          border: 1px solid rgba(139,111,255,0.3);
          border-radius: 999px;
          padding: 0.1rem 0.45rem;
        }
        .ve-td-num {
          font-family: 'Geist Mono', monospace;
          font-size: 0.75rem;
          color: var(--ve-mute);
          letter-spacing: 0.05em;
        }
        .ve-pts-bar {
          position: relative;
          height: 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
        }
        .ve-pts-fill {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          background: linear-gradient(90deg, rgba(139,111,255,0.6), rgba(111,255,212,0.5));
          border-radius: 4px;
          animation: ve-bar-in 0.8s ease both;
        }
        @keyframes ve-bar-in {
          from { width: 0 !important; }
        }
        .ve-pts-num {
          position: absolute;
          right: 0.4rem;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Geist Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
          color: var(--ve-text);
        }

        /* Tale of the tape ----------------------------------------------- */
        .ve-tape { margin-top: 2.5rem; }
        .ve-tape-card {
          display: grid;
          grid-template-columns: 1fr 5rem 1fr;
          gap: 0;
          align-items: center;
        }
        .ve-tape-col {
          padding: 1.4rem 1.6rem;
        }
        .ve-tape-col--right {
          text-align: right;
        }
        .ve-tape-col-label {
          display: block;
          font-family: 'Geist Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          color: var(--ve-indigo);
          margin-bottom: 0.3rem;
        }
        .ve-tape-name {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          font-size: 1.2rem;
          letter-spacing: -0.01em;
          margin: 0 0 0.3rem;
        }
        .ve-tape-stat {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
          margin-top: 0.5rem;
        }
        .ve-tape-col--right .ve-tape-stat {
          justify-content: flex-end;
        }
        .ve-tape-stat-num {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 1.4rem;
          font-variant-numeric: tabular-nums;
        }
        .ve-tape-stat-unit {
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: var(--ve-mute);
        }
        .ve-tape-progress { margin-top: 0.7rem; }
        .ve-tape-progress-track {
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .ve-tape-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--ve-indigo), var(--ve-teal));
          border-radius: 2px;
        }
        .ve-tape-progress-pct {
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          color: var(--ve-mute);
          margin-top: 0.2rem;
          display: block;
        }
        .ve-tape-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 0;
        }
        .ve-tape-divider {
          width: 1px;
          height: 80px;
          background: linear-gradient(to bottom, transparent, rgba(255,210,138,0.6), transparent);
        }
        .ve-tape-delta {
          font-family: 'Geist Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
        .ve-tape-delta--ahead { color: var(--ve-teal); }
        .ve-tape-delta--behind { color: var(--ve-magenta); }

        /* Today's lineup ------------------------------------------------- */
        .ve-lineup { margin-top: 2.5rem; }
        .ve-lineup-list { padding: 0; overflow: hidden; }
        .ve-lineup-row {
          display: grid;
          grid-template-columns: 2.5rem 1fr 5rem 5rem 6rem;
          gap: 0.5rem;
          padding: 0.8rem 1.2rem;
          align-items: center;
          border-bottom: 1px solid var(--ve-line);
          font-size: 0.88rem;
          transition: background 160ms ease;
        }
        .ve-lineup-row:last-child { border-bottom: none; }
        .ve-lineup-row:hover { background: rgba(255,255,255,0.02); }
        .ve-lineup-num {
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          color: var(--ve-mute);
          letter-spacing: 0.1em;
        }
        .ve-lineup-name {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          font-size: 1rem;
        }
        .ve-lineup-role {
          font-family: 'Geist Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          color: var(--ve-amber);
          border: 1px solid rgba(255,210,138,0.3);
          border-radius: 999px;
          padding: 0.1rem 0.45rem;
          text-align: center;
        }
        .ve-lineup-pts {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 1.05rem;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .ve-lineup-pts-unit {
          font-family: 'Geist Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: var(--ve-mute);
        }
        .ve-lineup-mbr {
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          color: var(--ve-mute);
          letter-spacing: 0.04em;
          text-align: right;
        }

        /* Transmissions -------------------------------------------------- */
        .ve-transmissions { margin-top: 2.5rem; }
        .ve-feed {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid var(--ve-line);
        }
        .ve-feed-row {
          display: grid;
          grid-template-columns: 5.5rem 1.5rem 1fr;
          gap: 0.4rem;
          padding: 0.65rem 0;
          align-items: center;
          border-bottom: 1px solid var(--ve-line);
          font-size: 0.88rem;
        }
        .ve-feed-time {
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          color: var(--ve-mute);
          letter-spacing: 0.05em;
        }
        .ve-feed-line {
          height: 1px;
          background: linear-gradient(90deg, var(--ve-line-strong), transparent);
        }
        .ve-feed-body { color: var(--ve-text); }
      `,
      }}
    />
  );
}
