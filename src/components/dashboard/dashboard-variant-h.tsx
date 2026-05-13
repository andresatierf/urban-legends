"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

/**
 * Variant H — Sketchnote (Hand-Drawn Notebook)
 *
 * A bullet-journal page aesthetic: off-white paper with a dot grid, all
 * "borders" are slightly wobbly hand-drawn SVG paths, handwriting fonts,
 * marker highlights, doodle annotations and a very restrained palette of
 * ink, paper, marker-yellow, marker-pink and marker-blue.
 */
export function DashboardVariantH({ data }: { data: DashboardFixtureData }) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayStr = today.toISOString().slice(0, 10);

  const activeTeams = data.teams.filter(
    (t) =>
      t.tournament.startDate <= todayStr && t.tournament.endDate >= todayStr,
  );

  const urgentDeadlines = data.deadlines.filter((d) => d.daysUntilEnd <= 3);
  const mostUrgent =
    urgentDeadlines.length > 0
      ? data.deadlines.reduce((a, b) =>
          a.daysUntilEnd < b.daysUntilEnd ? a : b,
        )
      : null;

  // ── Derived metric data ──────────────────────────────────────────────────
  const last7Dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Dates.push(d.toISOString().slice(0, 10));
  }
  const activeDaySet = new Set(
    data.activities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = last7Dates.filter((d) => activeDaySet.has(d)).length;

  const weekApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      last7Dates.includes(new Date(a.timestamp).toISOString().slice(0, 10)),
  ).length;

  const todayApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      new Date(a.timestamp).toISOString().slice(0, 10) === todayStr,
  ).length;

  const sortedTeams = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const topTeam = sortedTeams[0] ?? null;
  const squadRank = topTeam
    ? data.teams.filter(
        (t) =>
          t.tournament._id === topTeam.tournament._id &&
          t.team.points > topTeam.team.points,
      ).length + 1
    : 1;

  const maxPts = Math.max(...data.teams.map((t) => t.team.points), 1);

  // ── Team of the Day derivation ────────────────────────────────────────────
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

  // ── Top rival (tale of the tape) ─────────────────────────────────────────
  const userTop = sortedTeams[0] ?? null;
  const rival = sortedTeams[1] ?? null;

  return (
    <>
      <VariantHStyles />
      <div className="variant-h">
        <div className="vh-page">
          {/* Dot grid background */}
          <div className="vh-dotgrid" aria-hidden />

          {/* Margin doodles */}
          <MarginDoodles />

          <div className="vh-content">
            {/* 1. Page title */}
            <header className="vh-header">
              <div className="vh-title-row">
                <h1 className="vh-page-title">
                  {dateLabel}
                  <span className="vh-title-star" aria-hidden>
                    {" "}
                    ✦
                  </span>
                </h1>
              </div>
              <WavyUnderline color="var(--vh-yellow)" width={360} />
              <p className="vh-greeting">
                hi <span className="vh-greeting-name">{data.userName}</span>!
              </p>
            </header>

            {/* 2. TODAY box */}
            <section className="vh-section">
              <SketchyBox accent="ink" className="vh-today-box">
                <h2 className="vh-box-label">TODAY</h2>
                <ul className="vh-bullets">
                  <li className="vh-bullet">
                    <span className="vh-bullet-dot" aria-hidden>
                      •
                    </span>
                    <span>
                      <HighlightText>
                        {data.pendingSubmissionsCount}
                      </HighlightText>{" "}
                      submission{data.pendingSubmissionsCount === 1 ? "" : "s"}{" "}
                      waiting
                    </span>
                    <span className="vh-annotation">← check these!</span>
                  </li>
                  <li className="vh-bullet">
                    <span className="vh-bullet-dot" aria-hidden>
                      •
                    </span>
                    <span>
                      <HighlightText>
                        {data.activeTournamentsCount}
                      </HighlightText>{" "}
                      tournament{data.activeTournamentsCount === 1 ? "" : "s"}{" "}
                      live
                    </span>
                  </li>
                  <li className="vh-bullet">
                    <span className="vh-bullet-dot" aria-hidden>
                      •
                    </span>
                    <span>
                      <HighlightText>
                        {data.invitationsCount + data.joinRequests.length}
                      </HighlightText>{" "}
                      in inbox
                    </span>
                    {data.invitationsCount + data.joinRequests.length > 0 && (
                      <span className="vh-annotation">← don't ignore!</span>
                    )}
                  </li>
                  {activeTeams.length > 0 && (
                    <li className="vh-bullet">
                      <span className="vh-bullet-dot" aria-hidden>
                        •
                      </span>
                      <span>
                        <HighlightText>{activeTeams.length}</HighlightText> team
                        {activeTeams.length === 1 ? "" : "s"} competing now
                      </span>
                    </li>
                  )}
                </ul>
              </SketchyBox>
            </section>

            {/* 3. MY TEAMS */}
            <section className="vh-section">
              <h2 className="vh-section-title">
                <StarDoodle /> MY TEAMS
              </h2>
              <div className="vh-teams-grid">
                {data.teams.map((t) => (
                  <TeamCard key={t.team._id} entry={t} />
                ))}
              </div>
            </section>

            {/* 4. DROP BOX */}
            {(data.invitations.length > 0 ||
              data.joinRequests.length > 0 ||
              data.pendingSubmissions.length > 0 ||
              data.deadlines.length > 0) && (
              <section className="vh-section">
                <h2 className="vh-section-title">
                  <ArrowDoodle /> DROP BOX
                </h2>
                <div className="vh-dropbox">
                  {data.invitations.map((inv) => (
                    <StickyNote key={inv.id} color="yellow">
                      <div className="vh-sticky-tag">invite</div>
                      <div className="vh-sticky-title">{inv.teamName}</div>
                      <div className="vh-sticky-sub">
                        from {inv.invitedBy} · {inv.tournamentName}
                      </div>
                      <div className="vh-sticky-time">
                        {formatRelative(inv.timestamp)}
                      </div>
                      <div className="vh-sticky-actions">
                        <SketchButton>[yes]</SketchButton>
                        <SketchButton>[no]</SketchButton>
                      </div>
                    </StickyNote>
                  ))}
                  {data.joinRequests.map((jr) => (
                    <StickyNote
                      key={jr.id}
                      color="blue"
                      urgent={false}
                      annotate={mostUrgent === null ? "← this one!" : undefined}
                    >
                      <div className="vh-sticky-tag">knock knock</div>
                      <div className="vh-sticky-title">{jr.userName}</div>
                      <div className="vh-sticky-sub">
                        wants in @ {jr.teamName}
                      </div>
                      <div className="vh-sticky-time">
                        {formatRelative(jr.timestamp)}
                      </div>
                      <div className="vh-sticky-actions">
                        <SketchButton>[let in]</SketchButton>
                        <SketchButton>[pass]</SketchButton>
                      </div>
                    </StickyNote>
                  ))}
                  {data.pendingSubmissions.map((s) => (
                    <StickyNote key={s.id} color="yellow">
                      <div className="vh-sticky-tag">pending</div>
                      <div className="vh-sticky-title">{s.teamName}</div>
                      <div className="vh-sticky-sub">
                        {s.tournamentName} · {s.date}
                      </div>
                      <div className="vh-sticky-time">waiting for review</div>
                    </StickyNote>
                  ))}
                  {data.deadlines.map((d) => (
                    <StickyNote
                      key={d.tournament._id}
                      color={d.daysUntilEnd <= 3 ? "pink" : "blue"}
                      urgent={d.daysUntilEnd <= 3}
                      annotate={
                        mostUrgent?.tournament._id === d.tournament._id
                          ? "← this one!"
                          : undefined
                      }
                    >
                      <div className="vh-sticky-tag">
                        {d.daysUntilEnd <= 3 ? "urgent!" : "deadline"}
                      </div>
                      <div className="vh-sticky-title">{d.tournament.name}</div>
                      <div className="vh-sticky-sub">
                        {d.daysUntilEnd} day{d.daysUntilEnd === 1 ? "" : "s"}{" "}
                        left
                      </div>
                      <div className="vh-sticky-time">T-{d.daysUntilEnd}d</div>
                    </StickyNote>
                  ))}
                </div>
              </section>
            )}

            {/* 5. TIMELINE */}
            <section className="vh-section">
              <h2 className="vh-section-title">
                <DotArrowDoodle /> TIMELINE
              </h2>
              <div className="vh-timeline">
                <div className="vh-timeline-line" aria-hidden />
                {data.activities.slice(0, 7).map((a, i) => (
                  <div key={i} className="vh-timeline-entry">
                    <div className="vh-timeline-dot" aria-hidden />
                    <div className="vh-timeline-body">
                      <span className="vh-timeline-time">
                        {formatRelative(a.timestamp)}
                      </span>
                      <span className="vh-timeline-text">{a.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. ADMIN BACKSTAGE */}
            {data.isAdmin && data.adminStats && (
              <section className="vh-section">
                <h2 className="vh-section-title">
                  <CircleDoodle /> BACKSTAGE
                </h2>
                <SketchyBox accent="blue" className="vh-backstage">
                  <div className="vh-backstage-grid">
                    <BackstageStat
                      value={data.adminStats.users.total}
                      label="total users"
                      trend={`+${data.adminStats.users.newThisWeek} this week`}
                      color="blue"
                    />
                    <BackstageStat
                      value={data.adminStats.tournaments.active}
                      label="active now"
                      trend={`${data.adminStats.tournaments.upcoming} upcoming`}
                      color="ink"
                    />
                    <BackstageStat
                      value={data.adminStats.submissions.pending}
                      label="to review"
                      trend={`${data.adminStats.submissions.approved} approved`}
                      color="pink"
                    />
                    <BackstageStat
                      value={Math.round(
                        (data.adminStats.submissions.approved /
                          Math.max(data.adminStats.submissions.total, 1)) *
                          100,
                      )}
                      label="approval %"
                      trend={`${data.adminStats.submissions.rejected} rejected`}
                      color="ink"
                      suffix="%"
                    />
                  </div>
                </SketchyBox>
              </section>
            )}

            {/* 7. METRIC CARDS */}
            <section className="vh-section vh-section--anim">
              <h2 className="vh-section-title">
                <StarDoodle /> THIS WEEK
              </h2>
              <div className="vh-metrics-row">
                <MetricStickyCard
                  label="STREAK"
                  value={streakDays}
                  unit="DAYS"
                  color="yellow"
                  sparkline={last7Dates.map((d) =>
                    activeDaySet.has(d) ? 1 : 0,
                  )}
                />
                <MetricStickyCard
                  label="THIS WEEK"
                  value={weekApproved}
                  unit="APPROVED"
                  color="blue"
                  sparkline={last7Dates.map(
                    (d) =>
                      data.activities.filter(
                        (a) =>
                          a.type === "submission_approved" &&
                          new Date(a.timestamp).toISOString().slice(0, 10) ===
                            d,
                      ).length,
                  )}
                />
                <MetricStickyCard
                  label="TODAY"
                  value={todayApproved}
                  unit="LOGGED"
                  color="pink"
                  sparkline={[0, 0, 0, 0, 0, 0, todayApproved]}
                />
                <MetricStickyCard
                  label="SQUAD RANK"
                  value={squadRank}
                  unit="PLACE"
                  color="yellow"
                  sparkline={[
                    squadRank + 2,
                    squadRank + 1,
                    squadRank + 1,
                    squadRank,
                    squadRank,
                    squadRank,
                    squadRank,
                  ]}
                />
              </div>
            </section>

            {/* 8. LEAGUE STANDINGS */}
            {data.teams.length > 0 && (
              <section className="vh-section vh-section--anim">
                <h2 className="vh-section-title">
                  <ArrowDoodle /> LEAGUE STANDINGS
                </h2>
                <div className="vh-standings-wrap">
                  <table className="vh-standings-table">
                    <thead>
                      <tr>
                        <th className="vh-st-th">#</th>
                        <th className="vh-st-th">TEAM</th>
                        <th className="vh-st-th">TOURNAMENT</th>
                        <th className="vh-st-th">ROLE</th>
                        <th className="vh-st-th">MBR</th>
                        <th className="vh-st-th">POINTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.map((t, i) => (
                        <tr key={t.team._id} className="vh-st-row">
                          <td className="vh-st-rank">
                            {String(i + 1).padStart(2, "0")}
                            {i === 0 && (
                              <span className="vh-st-leader-arrow" aria-hidden>
                                {" "}
                                ↑
                              </span>
                            )}
                          </td>
                          <td className="vh-st-team">
                            <span className="vh-st-name">{t.team.name}</span>
                            {t.userRole === "captain" && (
                              <span className="vh-st-cap">★ cap</span>
                            )}
                          </td>
                          <td className="vh-st-tour">{t.tournament.name}</td>
                          <td>
                            <span className="vh-st-role">{t.userRole}</span>
                          </td>
                          <td className="vh-st-num">{t.memberCount}</td>
                          <td className="vh-st-pts-cell">
                            <div className="vh-st-bar-wrap">
                              <div
                                className="vh-st-bar-fill"
                                style={{
                                  width: `${(t.team.points / maxPts) * 100}%`,
                                }}
                              />
                              <span className="vh-st-pts-num">
                                {t.team.points}
                              </span>
                            </div>
                            {i === 0 && (
                              <span className="vh-st-annotation">leader!</span>
                            )}
                            {i === 1 && sortedTeams.length > 2 && (
                              <span className="vh-st-annotation">
                                neck and neck
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 9. TEAM OF THE DAY */}
            <section className="vh-section vh-section--anim">
              <h2 className="vh-section-title">
                <StarDoodle /> TOP CREW
              </h2>
              {mvpTeam ? (
                <div className="vh-mvp-card">
                  <div className="vh-mvp-trophy" aria-hidden>
                    <TrophyDoodle />
                  </div>
                  <div className="vh-mvp-body">
                    <div className="vh-mvp-ribbon">Squad of the Day</div>
                    <div className="vh-mvp-name">{mvpTeam.team.name}</div>
                    <p className="vh-mvp-detail">
                      <strong>{mvpTeam.tournament.name}</strong> &mdash;{" "}
                      <HighlightText>{mvpDisplayCount}</HighlightText>{" "}
                      submission{mvpDisplayCount === 1 ? "" : "s"}{" "}
                      {mvpCountToday > 0 ? "today" : "this period"} &middot;{" "}
                      {mvpTeam.memberCount} member
                      {mvpTeam.memberCount === 1 ? "" : "s"}
                      {mvpTeam.userRole === "captain" && " (you captain this!)"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="vh-mvp-card">
                  <div className="vh-mvp-body">
                    <div className="vh-mvp-ribbon">Squad of the Day</div>
                    <p className="vh-mvp-detail">No teams yet this period.</p>
                  </div>
                </div>
              )}
            </section>

            {/* 10. TOP RIVAL (Tale of the Tape) */}
            {userTop && rival && (
              <section className="vh-section vh-section--anim">
                <h2 className="vh-section-title">
                  <DotArrowDoodle /> TALE OF THE TAPE
                </h2>
                <div className="vh-tape-wrap">
                  <TapeBox
                    teamName={userTop.team.name}
                    captain={userTop.userRole === "captain"}
                    members={userTop.memberCount}
                    points={userTop.team.points}
                    tournamentName={userTop.tournament.name}
                    startDate={userTop.tournament.startDate}
                    endDate={userTop.tournament.endDate}
                    label="YOU"
                    color="yellow"
                  />
                  <div className="vh-tape-vs">
                    <span className="vh-tape-vs-text">vs.</span>
                    {userTop.team.points >= rival.team.points ? (
                      <span className="vh-tape-delta vh-tape-delta--up">
                        up by {userTop.team.points - rival.team.points} ↑
                      </span>
                    ) : (
                      <span className="vh-tape-delta vh-tape-delta--down">
                        behind by {rival.team.points - userTop.team.points} ↓
                      </span>
                    )}
                  </div>
                  <TapeBox
                    teamName={rival.team.name}
                    captain={rival.userRole === "captain"}
                    members={rival.memberCount}
                    points={rival.team.points}
                    tournamentName={rival.tournament.name}
                    startDate={rival.tournament.startDate}
                    endDate={rival.tournament.endDate}
                    label="RIVAL"
                    color="pink"
                  />
                </div>
              </section>
            )}

            {/* 11. TODAY'S LINEUP */}
            {data.teams.length > 0 && (
              <section className="vh-section vh-section--anim">
                <h2 className="vh-section-title">
                  <CircleDoodle /> TODAY&apos;S LINEUP
                </h2>
                <div className="vh-lineup">
                  {data.teams.map((t, i) => (
                    <div key={t.team._id} className="vh-lineup-row">
                      <span className="vh-lineup-num">
                        <svg
                          aria-hidden
                          viewBox="0 0 28 28"
                          width="24"
                          height="24"
                        >
                          <circle
                            cx="14"
                            cy="14"
                            r="12"
                            fill="none"
                            stroke="#2a2a2a"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeDasharray="4 2"
                          />
                          <text
                            x="14"
                            y="19"
                            textAnchor="middle"
                            fontFamily="Kalam, cursive"
                            fontSize="12"
                            fill="#2a2a2a"
                          >
                            {i + 1}
                          </text>
                        </svg>
                      </span>
                      <span className="vh-lineup-name">{t.team.name}</span>
                      <span className="vh-lineup-role vh-lineup-role--pill">
                        {t.userRole}
                      </span>
                      <span className="vh-lineup-pts">
                        <HighlightText>{t.team.points}</HighlightText> pts
                      </span>
                      <span className="vh-lineup-mbr">
                        {t.memberCount} members
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SketchyBox({
  children,
  accent = "ink",
  className = "",
}: {
  children: React.ReactNode;
  accent?: "ink" | "blue" | "pink" | "yellow";
  className?: string;
}) {
  // Hand-jittered rectangle paths — each corner offset 1–3px for a sketchy look
  // Two overlapping strokes for that double-stroke marker feel
  const colors: Record<string, string> = {
    ink: "#2a2a2a",
    blue: "#a8c8ff",
    pink: "#ffb1b1",
    yellow: "#fff2a8",
  };
  const strokeColor = accent === "ink" ? "#2a2a2a" : colors[accent];

  return (
    <div className={`vh-sketchy-box ${className}`}>
      {/* SVG border overlay — positioned absolute over the box */}
      <svg
        className="vh-sketchy-svg"
        aria-hidden
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Outer wobbly stroke */}
        <path
          d="M2.5,2.8 L97.2,1.5 L98.1,97.8 L1.8,98.5 Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Second pass — slightly offset for double-stroke feel */}
        <path
          d="M1.8,3.5 L97.8,2.2 L98.8,98.3 L2.2,97.8 Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="vh-sketchy-inner">{children}</div>
    </div>
  );
}

function TeamCard({ entry }: { entry: DashboardFixtureData["teams"][number] }) {
  const { team, tournament, memberCount, userRole } = entry;
  const isCaptain = userRole === "captain";

  return (
    <div className="vh-team-card">
      {/* SVG sketchy outline */}
      <svg
        className="vh-team-svg"
        aria-hidden
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M2,3 L98,1.5 L97.5,98 L1.8,97.5 Z"
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="vh-team-inner">
        <div className="vh-team-top">
          <h3 className="vh-team-name">{team.name}</h3>
          {isCaptain && <CrownDoodle />}
        </div>
        <div className="vh-team-tour">{tournament.name}</div>
        <div className="vh-team-foot">
          <CircledNumber value={team.points} color="pink" label="pts" />
          <span className="vh-team-members">{memberCount} members</span>
        </div>
      </div>
    </div>
  );
}

function StickyNote({
  children,
  color,
  urgent = false,
  annotate,
}: {
  children: React.ReactNode;
  color: "yellow" | "pink" | "blue";
  urgent?: boolean;
  annotate?: string;
}) {
  return (
    <div
      className={`vh-sticky vh-sticky--${color}${urgent ? " vh-sticky--urgent" : ""}`}
    >
      {/* Sketchy sticky border */}
      <svg
        className="vh-sticky-svg"
        aria-hidden
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M1.8,2.5 L98,1.8 L97.5,97.5 L2.2,98 Z"
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="vh-sticky-content">{children}</div>
      {annotate && <div className="vh-sticky-annotate">{annotate}</div>}
    </div>
  );
}

function SketchButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="vh-sketch-btn">
      <svg
        className="vh-btn-svg"
        aria-hidden
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M2,4 L98,2 L97,97 L2.5,98 Z"
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="vh-btn-label">{children}</span>
    </button>
  );
}

function HighlightText({ children }: { children: React.ReactNode }) {
  return <span className="vh-highlight">{children}</span>;
}

function CircledNumber({
  value,
  color,
  label,
}: {
  value: number;
  color: "pink" | "blue" | "yellow";
  label: string;
}) {
  return (
    <span className={`vh-circled vh-circled--${color}`}>
      <svg
        className="vh-circle-svg"
        aria-hidden
        viewBox="0 0 60 28"
        preserveAspectRatio="none"
      >
        <ellipse
          cx="30"
          cy="14"
          rx="28"
          ry="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="vh-circled-val">{value}</span>
      <span className="vh-circled-label">{label}</span>
    </span>
  );
}

function BackstageStat({
  value,
  label,
  trend,
  color,
  suffix = "",
}: {
  value: number;
  label: string;
  trend: string;
  color: "ink" | "blue" | "pink";
  suffix?: string;
}) {
  return (
    <div className={`vh-bs-stat vh-bs-stat--${color}`}>
      <div className="vh-bs-val">
        {value}
        {suffix}
      </div>
      <div className="vh-bs-label">{label}</div>
      <div className="vh-bs-trend">↑ {trend}</div>
    </div>
  );
}

function WavyUnderline({ color, width }: { color: string; width: number }) {
  const h = 10;
  const freq = 20; // wave period px
  const numWaves = Math.floor(width / freq);
  const points: string[] = [];
  for (let i = 0; i <= numWaves; i++) {
    const x = i * freq;
    const y = i % 2 === 0 ? h * 0.2 : h * 0.8;
    if (i === 0) points.push(`M0,${y}`);
    else {
      const cpx = (i - 0.5) * freq;
      const prevY = (i - 1) % 2 === 0 ? h * 0.2 : h * 0.8;
      const cpy = prevY === h * 0.2 ? h : 0;
      points.push(`Q${cpx},${cpy} ${x},${y}`);
    }
  }
  return (
    <svg
      className="vh-wavy"
      aria-hidden
      viewBox={`0 0 ${width} ${h}`}
      width={width}
      height={h}
    >
      <path
        d={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG doodles
// ---------------------------------------------------------------------------

function StarDoodle() {
  return (
    <svg
      className="vh-doodle-icon"
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
    >
      <path
        d="M12 2.5 L13.8 9.2 L20.5 9.2 L15.2 13.6 L17.2 20.5 L12 16.5 L6.8 20.5 L8.8 13.6 L3.5 9.2 L10.2 9.2 Z"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowDoodle() {
  return (
    <svg
      className="vh-doodle-icon"
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
    >
      <path
        d="M3 12 Q10 8 18 12"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 8.5 L18.5 12 L14 15.5"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotArrowDoodle() {
  return (
    <svg
      className="vh-doodle-icon"
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
    >
      <circle cx="4" cy="12" r="2" fill="#2a2a2a" />
      <circle cx="10" cy="12" r="1.5" fill="#2a2a2a" opacity="0.6" />
      <circle cx="15" cy="12" r="1" fill="#2a2a2a" opacity="0.35" />
      <path
        d="M17 9 L21 12 L17 15"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CircleDoodle() {
  return (
    <svg
      className="vh-doodle-icon"
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

function CrownDoodle() {
  return (
    <svg
      className="vh-crown"
      aria-label="captain"
      viewBox="0 0 32 20"
      width="26"
      height="16"
    >
      <path
        d="M3 17 L3 10 L9 15 L16 3 L23 15 L29 10 L29 17 Z"
        fill="none"
        stroke="#ffb1b1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="16"
        width="26"
        height="2.5"
        rx="0.5"
        fill="#ffb1b1"
        opacity="0.5"
      />
    </svg>
  );
}

function MarginDoodles() {
  return (
    <svg
      className="vh-margin-doodles"
      aria-hidden
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Top-right star */}
      <path
        d="M740 30 l4 -12 l4 12 l12 4 l -12 4 l -4 12 l -4 -12 l -12 -4 z"
        fill="#2a2a2a"
        opacity="0.2"
      />
      {/* Another star lower right */}
      <path
        d="M770 110 l3 -8 l3 8 l8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 z"
        fill="#2a2a2a"
        opacity="0.15"
      />
      {/* Spiral bottom-left */}
      <path
        d="M40 1100 Q44 1090 50 1095 Q58 1102 52 1110 Q44 1120 36 1112 Q28 1102 36 1092 Q46 1080 58 1090"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* Arrow annotation bottom area */}
      <path
        d="M60 900 Q80 880 100 900"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.18"
      />
      <path
        d="M95 893 L101 901 L93 906"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.18"
      />
      {/* Dotted corner decoration top-left */}
      <circle cx="25" cy="25" r="2" fill="#2a2a2a" opacity="0.15" />
      <circle cx="33" cy="25" r="2" fill="#2a2a2a" opacity="0.12" />
      <circle cx="25" cy="33" r="2" fill="#2a2a2a" opacity="0.12" />
      {/* Small "→ wow" bottom-right margin */}
      <text
        x="720"
        y="400"
        fontFamily="Caveat, cursive"
        fontSize="14"
        fill="#2a2a2a"
        opacity="0.2"
        transform="rotate(5 720 400)"
      >
        → wow
      </text>
      {/* Tiny stars scattered */}
      <path
        d="M55 450 l2 -6 l2 6 l6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z"
        fill="#2a2a2a"
        opacity="0.15"
      />
      <path
        d="M760 600 l2 -5 l2 5 l5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 z"
        fill="#2a2a2a"
        opacity="0.12"
      />
    </svg>
  );
}

function MetricStickyCard({
  label,
  value,
  unit,
  color,
  sparkline,
}: {
  label: string;
  value: number;
  unit: string;
  color: "yellow" | "blue" | "pink";
  sparkline: number[];
}) {
  const max = Math.max(...sparkline, 1);
  const w = 60;
  const h = 24;
  const pts = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`vh-metric-card vh-metric-card--${color}`}>
      <svg
        className="vh-sketchy-svg"
        aria-hidden
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M2.5,2.8 L97.2,1.5 L98.1,97.8 L1.8,98.5 Z"
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="vh-metric-inner">
        <div className="vh-metric-label">{label}</div>
        <div className="vh-metric-value">{value}</div>
        <div className="vh-metric-unit">{unit}</div>
        <svg
          className="vh-metric-sparkline"
          aria-hidden
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
        >
          <polyline
            points={pts}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 1.5"
            opacity="0.55"
          />
        </svg>
      </div>
    </div>
  );
}

function TrophyDoodle() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 44"
      width="40"
      height="44"
      className="vh-trophy-svg"
    >
      <path
        d="M10 4 L30 4 L30 22 Q30 34 20 36 Q10 34 10 22 Z"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4 L10 4 Q8 14 10 20"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M36 4 L30 4 Q32 14 30 20"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="38"
        x2="26"
        y2="38"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="11"
        y="38"
        width="18"
        height="4"
        rx="1"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TapeBox({
  teamName,
  captain,
  members,
  points,
  tournamentName,
  startDate,
  endDate,
  label,
  color,
}: {
  teamName: string;
  captain: boolean;
  members: number;
  points: number;
  tournamentName: string;
  startDate: string;
  endDate: string;
  label: string;
  color: "yellow" | "pink";
}) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const progress = Math.min(
    1,
    Math.max(0, (now - start) / Math.max(end - start, 1)),
  );
  const pct = Math.round(progress * 100);

  return (
    <div className={`vh-tape-box vh-tape-box--${color}`}>
      <svg
        className="vh-sketchy-svg"
        aria-hidden
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M2.5,2.8 L97.2,1.5 L98.1,97.8 L1.8,98.5 Z"
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="vh-tape-box-inner">
        <div className="vh-tape-box-label">{label}</div>
        <div className="vh-tape-box-name">
          {teamName}
          {captain && <CrownDoodle />}
        </div>
        <div className="vh-tape-box-tour">{tournamentName}</div>
        <div className="vh-tape-box-stats">
          <span>{members} mbr</span>
          <span>
            <HighlightText>{points}</HighlightText> pts
          </span>
        </div>
        <div className="vh-tape-progress-wrap">
          <div className="vh-tape-progress-bar">
            <div
              className="vh-tape-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="vh-tape-progress-label">{pct}% thru</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function VariantHStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Caveat:wght@500;700&family=Patrick+Hand&display=swap');

        .variant-h {
          --vh-paper: #fdfcf7;
          --vh-ink: #1a1a1a;
          --vh-sketch: #2a2a2a;
          --vh-yellow: #fff2a8;
          --vh-pink: #ffb1b1;
          --vh-blue: #a8c8ff;
          --vh-mute: #7a7468;
          font-family: 'Patrick Hand', 'Kalam', cursive;
          color: var(--vh-ink);
        }

        .vh-page {
          position: relative;
          background-color: var(--vh-paper);
          background-image: radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px);
          background-size: 18px 18px;
          padding: 2.5rem 2rem 3rem;
          min-height: 100%;
          overflow: hidden;
          isolation: isolate;
        }

        .vh-dotgrid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .vh-margin-doodles {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: visible;
        }

        .vh-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
          margin: 0 auto;
        }

        /* Header --------------------------------------------------------- */
        .vh-header { margin-bottom: 2.5rem; }

        .vh-title-row { display: flex; align-items: baseline; gap: 0.4rem; }

        .vh-page-title {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: clamp(1.6rem, 5vw, 2.4rem);
          line-height: 1.1;
          margin: 0 0 0.35rem;
          color: var(--vh-ink);
        }

        .vh-title-star {
          color: var(--vh-mute);
          font-size: 0.8em;
        }

        .vh-wavy {
          display: block;
          margin: 0.1rem 0 1.1rem;
        }

        .vh-greeting {
          font-family: 'Caveat', cursive;
          font-weight: 500;
          font-size: 1.55rem;
          color: var(--vh-mute);
          margin: 0;
          transform: rotate(-1.2deg);
          display: inline-block;
          line-height: 1;
        }

        .vh-greeting-name {
          font-weight: 700;
          color: var(--vh-ink);
          font-size: 1.15em;
        }

        /* Sections ------------------------------------------------------- */
        .vh-section { margin-bottom: 2.4rem; }

        .vh-section-title {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: 0.06em;
          margin: 0 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--vh-ink);
        }

        .vh-doodle-icon {
          flex-shrink: 0;
          opacity: 0.75;
        }

        /* Sketchy box ---------------------------------------------------- */
        .vh-sketchy-box {
          position: relative;
          border-radius: 4px;
        }

        .vh-sketchy-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        .vh-sketchy-inner {
          padding: 1.2rem 1.4rem 1.2rem;
          position: relative;
          z-index: 1;
        }

        /* TODAY box ------------------------------------------------------- */
        .vh-today-box { background: transparent; }

        .vh-box-label {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.18em;
          color: var(--vh-mute);
          margin: 0 0 0.75rem;
          text-transform: uppercase;
        }

        .vh-bullets {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .vh-bullet {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          font-family: 'Patrick Hand', cursive;
          font-size: 1.05rem;
          line-height: 1.4;
          flex-wrap: wrap;
        }

        .vh-bullet-dot {
          color: var(--vh-mute);
          font-size: 1.3em;
          line-height: 0.8;
          flex-shrink: 0;
        }

        .vh-annotation {
          font-family: 'Caveat', cursive;
          font-weight: 500;
          font-size: 1rem;
          color: var(--vh-mute);
          white-space: nowrap;
        }

        /* Highlight ------------------------------------------------------ */
        .vh-highlight {
          position: relative;
          display: inline-block;
          padding: 0 0.2em;
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.1em;
          color: var(--vh-ink);
          background: var(--vh-yellow);
          /* Slight slant for brush-stroke feel */
          transform: skewX(-3deg);
          border-radius: 2px;
        }

        /* Teams ---------------------------------------------------------- */
        .vh-teams-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 580px) {
          .vh-teams-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .vh-team-card {
          position: relative;
          min-height: 5.5rem;
        }

        .vh-team-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        .vh-team-inner {
          padding: 1rem 1.1rem 0.9rem;
          position: relative;
          z-index: 1;
        }

        .vh-team-top {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          justify-content: space-between;
          margin-bottom: 0.15rem;
        }

        .vh-team-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.15rem;
          line-height: 1.2;
          margin: 0;
        }

        .vh-crown {
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .vh-team-tour {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.9rem;
          color: var(--vh-mute);
          margin-bottom: 0.7rem;
        }

        .vh-team-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .vh-team-members {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.88rem;
          color: var(--vh-mute);
        }

        /* Circled number ------------------------------------------------- */
        .vh-circled {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0 0.35rem;
        }

        .vh-circled--pink { color: #c05070; }
        .vh-circled--blue { color: #4878b8; }
        .vh-circled--yellow { color: #8a7a20; }

        .vh-circle-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }

        .vh-circled-val {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1rem;
          position: relative;
          z-index: 1;
        }

        .vh-circled-label {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.8rem;
          opacity: 0.75;
          position: relative;
          z-index: 1;
        }

        /* Sticky notes --------------------------------------------------- */
        .vh-dropbox {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.9rem;
        }
        @media (min-width: 580px) {
          .vh-dropbox { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 800px) {
          .vh-dropbox { grid-template-columns: repeat(3, 1fr); }
        }

        .vh-sticky {
          position: relative;
          min-height: 7rem;
          border-radius: 3px;
          transition: transform 140ms ease;
        }

        .vh-sticky:nth-child(odd) { transform: rotate(-0.6deg); }
        .vh-sticky:nth-child(even) { transform: rotate(0.5deg); }
        .vh-sticky:hover { transform: rotate(0deg) scale(1.015); }

        .vh-sticky--yellow { background: var(--vh-yellow); }
        .vh-sticky--pink { background: var(--vh-pink); }
        .vh-sticky--blue { background: var(--vh-blue); }

        .vh-sticky--urgent {
          box-shadow: 0 2px 12px rgba(255, 80, 80, 0.18);
        }

        .vh-sticky-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        .vh-sticky-content {
          padding: 0.85rem 1rem;
          position: relative;
          z-index: 1;
        }

        .vh-sticky-tag {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--vh-ink);
          opacity: 0.6;
          margin-bottom: 0.3rem;
        }

        .vh-sticky-title {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.05rem;
          line-height: 1.2;
          margin-bottom: 0.2rem;
        }

        .vh-sticky-sub {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.88rem;
          color: var(--vh-ink);
          opacity: 0.7;
          margin-bottom: 0.55rem;
          line-height: 1.3;
        }

        .vh-sticky-time {
          font-family: 'Caveat', cursive;
          font-weight: 500;
          font-size: 1rem;
          color: var(--vh-mute);
          margin-bottom: 0.45rem;
        }

        .vh-sticky-actions {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .vh-sticky-annotate {
          position: absolute;
          bottom: -1.4rem;
          right: 0.5rem;
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--vh-mute);
          white-space: nowrap;
          z-index: 3;
        }

        /* Sketch button -------------------------------------------------- */
        .vh-sketch-btn {
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.3rem 0.7rem;
          font-family: 'Kalam', cursive;
          font-size: 0.9rem;
          color: var(--vh-ink);
          transition: transform 100ms ease;
          min-width: 2.8rem;
        }

        .vh-sketch-btn:hover { transform: translateY(-1px); }

        .vh-btn-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        .vh-btn-label {
          position: relative;
          z-index: 1;
        }

        /* Timeline ------------------------------------------------------- */
        .vh-timeline {
          position: relative;
          padding-left: 1.8rem;
        }

        .vh-timeline-line {
          position: absolute;
          left: 0.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, var(--vh-sketch) 0%, transparent 100%);
          opacity: 0.25;
          border-radius: 2px;
        }

        .vh-timeline-entry {
          position: relative;
          display: flex;
          gap: 0.7rem;
          padding: 0.3rem 0 0.85rem;
          align-items: flex-start;
        }

        .vh-timeline-dot {
          position: absolute;
          left: -1.35rem;
          top: 0.55rem;
          width: 8px;
          height: 8px;
          background: var(--vh-paper);
          border: 2px solid var(--vh-sketch);
          border-radius: 50%;
          flex-shrink: 0;
          opacity: 0.7;
        }

        .vh-timeline-body {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .vh-timeline-time {
          font-family: 'Caveat', cursive;
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--vh-mute);
          line-height: 1;
        }

        .vh-timeline-text {
          font-family: 'Patrick Hand', cursive;
          font-size: 1rem;
          line-height: 1.35;
          color: var(--vh-ink);
        }

        /* Backstage ------------------------------------------------------ */
        .vh-backstage { background: transparent; }

        .vh-backstage-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
        }
        @media (min-width: 580px) {
          .vh-backstage-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .vh-bs-stat {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .vh-bs-val {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 2.2rem;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .vh-bs-stat--ink .vh-bs-val { color: var(--vh-ink); }
        .vh-bs-stat--blue .vh-bs-val { color: #4878b8; }
        .vh-bs-stat--pink .vh-bs-val { color: #c05070; }

        .vh-bs-label {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.88rem;
          color: var(--vh-mute);
        }

        .vh-bs-trend {
          font-family: 'Caveat', cursive;
          font-size: 0.85rem;
          color: var(--vh-mute);
          opacity: 0.8;
        }

        /* Animations ------------------------------------------------------- */
        @keyframes vh-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vh-bar-grow {
          from { width: 0 !important; }
        }
        @keyframes vh-wobble {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(-0.8deg); }
          75%  { transform: rotate(0.8deg); }
          100% { transform: rotate(0deg); }
        }

        .vh-section--anim {
          animation: vh-fade-up 320ms ease both;
        }
        .vh-section--anim:nth-child(2) { animation-delay: 100ms; }
        .vh-section--anim:nth-child(3) { animation-delay: 200ms; }
        .vh-section--anim:nth-child(4) { animation-delay: 300ms; }
        .vh-section--anim:nth-child(5) { animation-delay: 400ms; }

        .vh-st-bar-fill {
          animation: vh-bar-grow 600ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .vh-section--anim { animation: none; }
          .vh-st-bar-fill   { animation: none; }
          .vh-metric-card   { animation: none; }
        }

        /* Metric sticky cards ---------------------------------------------- */
        .vh-metrics-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.9rem;
        }
        @media (min-width: 580px) {
          .vh-metrics-row { grid-template-columns: repeat(4, 1fr); }
        }

        .vh-metric-card {
          position: relative;
          border-radius: 4px;
          min-height: 6rem;
          transition: transform 140ms ease, box-shadow 140ms ease;
          animation: vh-wobble 600ms ease both;
          animation-delay: 200ms;
        }
        .vh-metric-card:nth-child(2) { animation-delay: 300ms; }
        .vh-metric-card:nth-child(3) { animation-delay: 400ms; }
        .vh-metric-card:nth-child(4) { animation-delay: 500ms; }

        .vh-metric-card:hover {
          transform: translateY(-2px) rotate(0.4deg);
          box-shadow: 2px 6px 16px rgba(0,0,0,0.10);
        }

        .vh-metric-card--yellow { background: var(--vh-yellow); }
        .vh-metric-card--blue   { background: var(--vh-blue); }
        .vh-metric-card--pink   { background: var(--vh-pink); }

        .vh-metric-inner {
          padding: 0.85rem 0.9rem 0.7rem;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .vh-metric-label {
          font-family: 'Caveat', cursive;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--vh-mute);
          border-bottom: 2px dashed rgba(0,0,0,0.12);
          padding-bottom: 0.25rem;
          margin-bottom: 0.2rem;
        }

        .vh-metric-value {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 2.1rem;
          line-height: 1;
          color: var(--vh-ink);
        }

        .vh-metric-unit {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--vh-mute);
          margin-bottom: 0.3rem;
        }

        .vh-metric-sparkline { display: block; }

        /* Standings table -------------------------------------------------- */
        .vh-standings-wrap { overflow-x: auto; }

        .vh-standings-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-family: 'Patrick Hand', cursive;
          font-size: 0.92rem;
        }

        .vh-st-th {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--vh-mute);
          padding: 0.35rem 0.7rem;
          border-bottom: 2px dashed rgba(0,0,0,0.18);
          text-align: left;
          white-space: nowrap;
        }

        .vh-st-row {
          border-bottom: 1px dashed rgba(0,0,0,0.1);
        }
        .vh-st-row:hover { background: rgba(255,242,168,0.35); }

        .vh-st-row td {
          padding: 0.5rem 0.7rem;
          vertical-align: middle;
        }

        .vh-st-rank {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--vh-ink);
          white-space: nowrap;
        }

        .vh-st-leader-arrow {
          font-family: 'Caveat', cursive;
          color: #c05070;
          font-size: 1rem;
        }

        .vh-st-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1rem;
        }

        .vh-st-team { display: flex; align-items: center; gap: 0.4rem; }

        .vh-st-cap {
          font-family: 'Caveat', cursive;
          font-size: 0.78rem;
          color: #c05070;
          white-space: nowrap;
        }

        .vh-st-tour {
          font-size: 0.85rem;
          color: var(--vh-mute);
          white-space: nowrap;
        }

        .vh-st-role {
          font-family: 'Caveat', cursive;
          font-size: 0.82rem;
          background: rgba(0,0,0,0.06);
          border-radius: 3px;
          padding: 0.1rem 0.4rem;
          border: 1px dashed rgba(0,0,0,0.15);
        }

        .vh-st-num {
          font-family: 'Kalam', cursive;
          text-align: center;
        }

        .vh-st-pts-cell {
          position: relative;
          min-width: 10rem;
        }

        .vh-st-bar-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          height: 1.4rem;
          background: rgba(0,0,0,0.04);
          border: 1px dashed rgba(0,0,0,0.12);
          border-radius: 2px;
          padding: 0 0.3rem;
          overflow: hidden;
          position: relative;
        }

        .vh-st-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--vh-yellow);
          border-right: 2px solid rgba(0,0,0,0.2);
          transition: width 600ms ease;
        }

        .vh-st-pts-num {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 0.9rem;
          position: relative;
          z-index: 1;
          margin-left: auto;
        }

        .vh-st-annotation {
          position: absolute;
          bottom: -1.1rem;
          right: 0;
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--vh-mute);
          white-space: nowrap;
        }

        /* MVP card --------------------------------------------------------- */
        .vh-mvp-card {
          display: flex;
          gap: 1.2rem;
          align-items: flex-start;
          background: var(--vh-yellow);
          border-radius: 4px;
          padding: 1.2rem 1.4rem;
          position: relative;
          border: 2px dashed rgba(0,0,0,0.18);
        }

        .vh-trophy-svg { flex-shrink: 0; }

        .vh-mvp-ribbon {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--vh-mute);
          margin-bottom: 0.25rem;
        }

        .vh-mvp-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.1;
          color: var(--vh-ink);
          margin-bottom: 0.35rem;
        }

        .vh-mvp-detail {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.95rem;
          color: var(--vh-ink);
          margin: 0;
          line-height: 1.4;
        }

        /* Tale of the tape ------------------------------------------------- */
        .vh-tape-wrap {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0.8rem;
          align-items: center;
        }

        @media (max-width: 500px) {
          .vh-tape-wrap {
            grid-template-columns: 1fr;
          }
        }

        .vh-tape-box {
          position: relative;
          border-radius: 4px;
          min-height: 7rem;
        }
        .vh-tape-box--yellow { background: var(--vh-yellow); }
        .vh-tape-box--pink   { background: var(--vh-pink); }

        .vh-tape-box-inner {
          padding: 0.9rem 1rem;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .vh-tape-box-label {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--vh-mute);
        }

        .vh-tape-box-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .vh-tape-box-tour {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.84rem;
          color: var(--vh-mute);
        }

        .vh-tape-box-stats {
          display: flex;
          gap: 0.8rem;
          font-family: 'Patrick Hand', cursive;
          font-size: 0.9rem;
          margin-top: 0.2rem;
        }

        .vh-tape-progress-wrap {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 0.4rem;
        }

        .vh-tape-progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(0,0,0,0.08);
          border: 1px dashed rgba(0,0,0,0.15);
          border-radius: 2px;
          overflow: hidden;
        }

        .vh-tape-progress-fill {
          height: 100%;
          background: rgba(0,0,0,0.22);
          border-radius: 2px;
        }

        .vh-tape-progress-label {
          font-family: 'Caveat', cursive;
          font-size: 0.8rem;
          color: var(--vh-mute);
          white-space: nowrap;
        }

        .vh-tape-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0 0.4rem;
        }

        .vh-tape-vs-text {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--vh-ink);
          transform: rotate(-2deg);
          display: inline-block;
        }

        .vh-tape-delta {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 0.85rem;
          white-space: nowrap;
          transform: rotate(-1deg);
          display: inline-block;
        }
        .vh-tape-delta--up   { color: #4878b8; }
        .vh-tape-delta--down { color: #c05070; }

        /* Today's lineup --------------------------------------------------- */
        .vh-lineup {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .vh-lineup-row {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.55rem 0.6rem;
          border-bottom: 1px dashed rgba(0,0,0,0.1);
          flex-wrap: wrap;
          transition: background 120ms ease;
        }
        .vh-lineup-row:hover { background: rgba(168,200,255,0.18); }

        .vh-lineup-num { flex-shrink: 0; }

        .vh-lineup-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: 1rem;
          flex: 1;
          min-width: 6rem;
        }

        .vh-lineup-role--pill {
          font-family: 'Caveat', cursive;
          font-size: 0.8rem;
          background: rgba(0,0,0,0.06);
          border: 1px dashed rgba(0,0,0,0.15);
          border-radius: 3px;
          padding: 0.1rem 0.45rem;
          white-space: nowrap;
        }

        .vh-lineup-pts {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .vh-lineup-mbr {
          font-family: 'Patrick Hand', cursive;
          font-size: 0.85rem;
          color: var(--vh-mute);
          white-space: nowrap;
        }
      `,
      }}
    />
  );
}
