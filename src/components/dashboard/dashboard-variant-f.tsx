"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

/**
 * Variant F — Riso Pop Zine (Playful Memphis Maximalism)
 *
 * The dashboard is a printed zine: warm paper background with risograph
 * grain, hand-drawn SVG decorations, slightly rotated cards, hot pink +
 * cobalt + butter yellow + mint accents. Chunky variable display type,
 * stamps and badges, and a deliberately unruly collage layout.
 */
export function DashboardVariantF({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const activeTeams = data.teams.filter(
    (t) => t.tournament.startDate <= today && t.tournament.endDate >= today,
  );

  // Derived metrics
  const approvedActivities = data.activities.filter(
    (a) => a.type === "submission_approved",
  );
  const todayApproved = approvedActivities.filter(
    (a) => new Date(a.timestamp).toISOString().slice(0, 10) === today,
  ).length;

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    new Date(now - i * 86_400_000).toISOString().slice(0, 10),
  );
  const activeDays = new Set(
    data.activities.map((a) =>
      new Date(a.timestamp).toISOString().slice(0, 10),
    ),
  );
  const streakDays = last7Days.filter((d) => activeDays.has(d)).length;

  const weekStart = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekApproved = approvedActivities.filter(
    (a) => new Date(a.timestamp).toISOString().slice(0, 10) >= weekStart,
  ).length;

  // Top team for squad rank
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

  // Sparkline for metric cards
  const sparkline = last7Days
    .slice()
    .reverse()
    .map(
      (d) =>
        approvedActivities.filter(
          (a) => new Date(a.timestamp).toISOString().slice(0, 10) === d,
        ).length,
    );

  // Standings
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

  // Top rival
  const userTop =
    data.teams.length > 0
      ? data.teams.reduce((best, t) =>
          t.team.points > best.team.points ? t : best,
        )
      : null;
  const rival =
    data.teams.length > 1
      ? data.teams
          .filter((t) => t.team._id !== userTop?.team._id)
          .reduce((best, t) => (t.team.points > best.team.points ? t : best))
      : null;
  const rivalDelta =
    userTop && rival ? userTop.team.points - rival.team.points : 0;

  return (
    <>
      <VariantFStyles />
      <div className="variant-f">
        <div className="vf-zine">
          <div className="vf-grain" aria-hidden />
          <Scribbles />

          {/* Cover */}
          <header className="vf-cover vf-entry vf-entry--0">
            <div className="vf-cover-row">
              <span className="vf-stamp vf-stamp--yellow">ISSUE 04</span>
              <span className="vf-stamp vf-stamp--mint">{today}</span>
              {data.isAdmin && (
                <span className="vf-stamp vf-stamp--pink">ADMIN MODE 💥</span>
              )}
            </div>
            <h1 className="vf-cover-title">
              hey
              <span className="vf-wave">,</span>
              <span className="vf-name"> {data.userName}</span>
              <span className="vf-bang">!</span>
            </h1>
            <p className="vf-cover-sub">
              {activeTeams.length > 0
                ? `you're rolling with ${activeTeams.length} active tournament${activeTeams.length === 1 ? "" : "s"} & ${data.pendingSubmissionsCount} thing${data.pendingSubmissionsCount === 1 ? "" : "s"} in the air.`
                : "nothing live right now — pick a fight, captain."}
            </p>
            <BigDoodle />
          </header>

          {/* Stat tiles */}
          <section className="vf-tiles vf-entry vf-entry--1">
            <Tile
              num={data.teams.length}
              label="teams"
              color="cobalt"
              shape="square"
            />
            <Tile
              num={activeTeams.length}
              label="active"
              color="pink"
              shape="circle"
            />
            <Tile
              num={data.pendingSubmissionsCount}
              label="pending"
              color="butter"
              shape="square"
            />
            <Tile
              num={data.invitationsCount + data.joinRequests.length}
              label="inbox"
              color="mint"
              shape="circle"
            />
          </section>

          {/* Metric cards row */}
          <section className="vf-section vf-entry vf-entry--2">
            <h2 className="vf-h">
              <span className="vf-h-marker" aria-hidden>
                ◈
              </span>
              by the numbers
            </h2>
            <div className="vf-metrics">
              <MetricCard
                label="STREAK"
                value={streakDays}
                unit="DAYS"
                color="cobalt"
                rotate={-1}
                sparkline={last7Days
                  .slice()
                  .reverse()
                  .map((d) => (activeDays.has(d) ? 1 : 0))}
              />
              <MetricCard
                label="THIS WEEK"
                value={weekApproved}
                unit="APPROVED"
                color="pink"
                rotate={1.2}
                sparkline={sparkline}
              />
              <MetricCard
                label="TODAY"
                value={todayApproved}
                unit="LOGGED"
                color="butter"
                rotate={-0.7}
                sparkline={sparkline}
              />
              <MetricCard
                label="SQUAD RANK"
                value={squadRank}
                unit="IN TOURNAMENT"
                color="mint"
                rotate={1.5}
                sparkline={[3, 2, 3, 2, 1, 2, squadRank]}
              />
            </div>
          </section>

          {/* Admin pull quote */}
          {data.isAdmin && data.adminStats && (
            <section className="vf-admin-quote vf-entry vf-entry--3">
              <div className="vf-quote-mark" aria-hidden>
                ✺
              </div>
              <div className="vf-quote-body">
                <div className="vf-quote-eyebrow">
                  backstage / platform pulse
                </div>
                <ul className="vf-quote-stats">
                  <li>
                    <span className="vf-num">
                      {data.adminStats.users.total}
                    </span>
                    <span className="vf-num-label">members</span>
                    <span className="vf-num-sub">
                      +{data.adminStats.users.newThisWeek} this wk
                    </span>
                  </li>
                  <li>
                    <span className="vf-num">
                      {data.adminStats.tournaments.active}
                    </span>
                    <span className="vf-num-label">live</span>
                    <span className="vf-num-sub">
                      {data.adminStats.tournaments.upcoming} on deck
                    </span>
                  </li>
                  <li>
                    <span className="vf-num">
                      {data.adminStats.submissions.pending}
                    </span>
                    <span className="vf-num-label">to review</span>
                    <span className="vf-num-sub">
                      {data.adminStats.submissions.approved} approved
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          )}

          {/* Team of the Day */}
          {mvpTeam && (
            <section className="vf-section vf-entry vf-entry--4">
              <h2 className="vf-h">
                <span className="vf-h-marker" aria-hidden>
                  ★
                </span>
                crew of the day
              </h2>
              <div className="vf-mvp">
                <div className="vf-mvp-trophy" aria-hidden>
                  <TrophySvg />
                </div>
                <div className="vf-mvp-body">
                  <div className="vf-sticker vf-sticker--pink vf-mvp-badge">
                    MVP CREW
                  </div>
                  <h3 className="vf-mvp-name">{mvpTeam.team.name}</h3>
                  <p className="vf-mvp-detail">
                    {mvpDisplayCount} submission
                    {mvpDisplayCount === 1 ? "" : "s"}{" "}
                    {mvpCountToday > 0 ? "today" : "this period"} ·{" "}
                    <strong>{mvpTeam.tournament.name}</strong>
                  </p>
                  <p className="vf-mvp-detail">
                    {mvpTeam.memberCount} member
                    {mvpTeam.memberCount === 1 ? "" : "s"}
                    {mvpTeam.userRole === "captain" && " · ★ you're captain"}
                  </p>
                  <span className="vf-mvp-cta vf-btn vf-btn--pink">
                    keep it up! ✦
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Top rival — tale of the tape */}
          {userTop && rival && (
            <section className="vf-section vf-entry vf-entry--5">
              <h2 className="vf-h">
                <span className="vf-h-marker" aria-hidden>
                  ⚡
                </span>
                tale of the tape
              </h2>
              <div className="vf-tape">
                <RisoCard
                  label="YOU"
                  name={userTop.team.name}
                  role={userTop.userRole}
                  members={userTop.memberCount}
                  points={userTop.team.points}
                  progress={Math.max(
                    0,
                    Math.min(
                      1,
                      (now - new Date(userTop.tournament.startDate).getTime()) /
                        Math.max(
                          new Date(userTop.tournament.endDate).getTime() -
                            new Date(userTop.tournament.startDate).getTime(),
                          1,
                        ),
                    ),
                  )}
                  palette="pink"
                  rotate={-1.8}
                />
                <div className="vf-tape-vs">
                  <span className="vf-tape-vs-label">VS</span>
                  <span className="vf-tape-delta">
                    {rivalDelta > 0
                      ? `ahead +${rivalDelta}`
                      : rivalDelta < 0
                        ? `behind ${rivalDelta}`
                        : "tied!"}
                  </span>
                </div>
                <RisoCard
                  label="RIVAL"
                  name={rival.team.name}
                  role={rival.userRole}
                  members={rival.memberCount}
                  points={rival.team.points}
                  progress={Math.max(
                    0,
                    Math.min(
                      1,
                      (now - new Date(rival.tournament.startDate).getTime()) /
                        Math.max(
                          new Date(rival.tournament.endDate).getTime() -
                            new Date(rival.tournament.startDate).getTime(),
                          1,
                        ),
                    ),
                  )}
                  palette="cobalt"
                  rotate={1.8}
                />
              </div>
            </section>
          )}

          {/* League standings table */}
          {standings.length > 0 && (
            <section className="vf-section vf-entry vf-entry--6">
              <h2 className="vf-h">
                <span className="vf-h-marker" aria-hidden>
                  ◉
                </span>
                league standings
              </h2>
              <div className="vf-standings">
                <table className="vf-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>TEAM</th>
                      <th>TOURNAMENT</th>
                      <th>ROLE</th>
                      <th>MBR</th>
                      <th>POINTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((t, i) => {
                      const barColors = [
                        "cobalt",
                        "pink",
                        "butter",
                        "mint",
                      ] as const;
                      const barColor = barColors[i % barColors.length];
                      return (
                        <tr key={t.team._id}>
                          <td>
                            <span className="vf-rank-stamp">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </td>
                          <td className="vf-table-team">
                            <span className="vf-table-name">{t.team.name}</span>
                            {t.userRole === "captain" && (
                              <span className="vf-cap-star">★ CAPTAIN</span>
                            )}
                          </td>
                          <td className="vf-table-tour">{t.tournament.name}</td>
                          <td>
                            <span
                              className={`vf-role-chip vf-role-chip--${t.userRole === "captain" ? "pink" : "mint"}`}
                            >
                              {t.userRole.toUpperCase()}
                            </span>
                          </td>
                          <td className="vf-table-mono">
                            {t.memberCount.toString().padStart(2, "0")}
                          </td>
                          <td>
                            <div className="vf-pts-bar">
                              <div
                                className={`vf-pts-bar-fill vf-pts-bar-fill--${barColor}`}
                                style={
                                  {
                                    "--vf-bar-target": `${(t.team.points / maxPts) * 100}%`,
                                  } as React.CSSProperties
                                }
                              />
                              <span className="vf-pts-bar-num">
                                {t.team.points.toString().padStart(4, "0")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Today's lineup roster */}
          {data.teams.length > 0 && (
            <section className="vf-section vf-entry vf-entry--7">
              <h2 className="vf-h">
                <span className="vf-h-marker" aria-hidden>
                  ▶
                </span>
                today's lineup
              </h2>
              <div className="vf-lineup">
                {data.teams.map((t, i) => {
                  const jerseyColors = [
                    "cobalt",
                    "pink",
                    "butter",
                    "mint",
                  ] as const;
                  const jColor = jerseyColors[i % jerseyColors.length];
                  return (
                    <div key={t.team._id} className="vf-lineup-row">
                      <span className={`vf-jersey vf-jersey--${jColor}`}>
                        {i + 1}
                      </span>
                      <span className="vf-lineup-name">{t.team.name}</span>
                      <span
                        className={`vf-role-chip vf-role-chip--${t.userRole === "captain" ? "pink" : "mint"}`}
                      >
                        {t.userRole.toUpperCase()}
                      </span>
                      <span className="vf-lineup-pts">
                        <strong>{t.team.points}</strong>
                        <span className="vf-lineup-pts-unit">pts</span>
                      </span>
                      <span className="vf-lineup-members">
                        {t.memberCount}✦
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* My teams collage */}
          <section className="vf-section vf-entry vf-entry--8">
            <h2 className="vf-h">
              <span className="vf-h-marker" aria-hidden>
                ★
              </span>
              my teams
            </h2>
            <div className="vf-collage">
              {data.teams.map((t, i) => {
                const palettes = ["cobalt", "pink", "butter", "mint"] as const;
                const palette = palettes[i % palettes.length];
                const rot = [-1.5, 1, -0.8, 1.6][i % 4];
                return (
                  <TeamSticker
                    key={t.team._id}
                    name={t.team.name}
                    tournament={t.tournament.name}
                    points={t.team.points}
                    members={t.memberCount}
                    role={t.userRole}
                    palette={palette}
                    rotate={rot}
                  />
                );
              })}
            </div>
          </section>

          {/* DROP BOX — pending actions, stacked like polaroids */}
          {(data.invitations.length > 0 ||
            data.joinRequests.length > 0 ||
            data.pendingSubmissions.length > 0 ||
            data.deadlines.length > 0) && (
            <section className="vf-section vf-entry vf-entry--9">
              <h2 className="vf-h">
                <span className="vf-h-marker" aria-hidden>
                  ✦
                </span>
                drop box
              </h2>
              <div className="vf-dropbox">
                {data.invitations.map((inv) => (
                  <Polaroid
                    key={inv.id}
                    sticker="INVITE"
                    stickerColor="pink"
                    title={inv.teamName}
                    sub={`${inv.invitedBy} → ${inv.tournamentName}`}
                    time={formatRelative(inv.timestamp)}
                    cta1="yes!"
                    cta2="nope"
                  />
                ))}
                {data.joinRequests.map((jr) => (
                  <Polaroid
                    key={jr.id}
                    sticker="KNOCK"
                    stickerColor="butter"
                    title={jr.userName}
                    sub={`wants in @ ${jr.teamName}`}
                    time={formatRelative(jr.timestamp)}
                    cta1="let in"
                    cta2="pass"
                  />
                ))}
                {data.pendingSubmissions.map((s) => (
                  <Polaroid
                    key={s.id}
                    sticker="PENDING"
                    stickerColor="mint"
                    title={s.teamName}
                    sub={`${s.tournamentName} · ${s.date}`}
                    time="waiting"
                  />
                ))}
                {data.deadlines.map((d) => (
                  <Polaroid
                    key={d.tournament._id}
                    sticker={d.daysUntilEnd <= 3 ? "⚡ CLOSING" : "DEADLINE"}
                    stickerColor={d.daysUntilEnd <= 3 ? "pink" : "cobalt"}
                    title={d.tournament.name}
                    sub={`${d.daysUntilEnd} day${d.daysUntilEnd === 1 ? "" : "s"} left`}
                    time={`T-${d.daysUntilEnd}d`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Feed as ticker-tape */}
          <section className="vf-section vf-entry vf-entry--10">
            <h2 className="vf-h">
              <span className="vf-h-marker" aria-hidden>
                ☼
              </span>
              what happened
            </h2>
            <div className="vf-feed">
              {data.activities.map((a, i) => (
                <div key={i} className="vf-feed-strip">
                  <span className="vf-feed-time">
                    {formatRelative(a.timestamp)}
                  </span>
                  <span className="vf-feed-perf" aria-hidden>
                    {"·".repeat(6)}
                  </span>
                  <span className="vf-feed-text">{a.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Colophon */}
          <footer className="vf-colophon">
            <span>printed with love</span>
            <span aria-hidden>✺</span>
            <span>bricolage &amp; plex mono</span>
            <span aria-hidden>✺</span>
            <span>{today}</span>
          </footer>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

type Palette = "cobalt" | "pink" | "butter" | "mint";

function Tile({
  num,
  label,
  color,
  shape,
}: {
  num: number;
  label: string;
  color: Palette;
  shape: "square" | "circle";
}) {
  return (
    <div className={`vf-tile vf-tile--${color} vf-tile--${shape}`}>
      <span className="vf-tile-num">{num}</span>
      <span className="vf-tile-label">{label}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  color,
  rotate,
  sparkline,
}: {
  label: string;
  value: number;
  unit: string;
  color: Palette;
  rotate: number;
  sparkline: number[];
}) {
  const max = Math.max(...sparkline, 1);
  const pts = sparkline
    .map(
      (v, i) =>
        `${(i / (sparkline.length - 1)) * 100},${100 - (v / max) * 100}`,
    )
    .join(" ");
  return (
    <div
      className={`vf-metric vf-metric--${color}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="vf-metric-rule" />
      <span className="vf-metric-label">{label}</span>
      <span className="vf-metric-value">{value}</span>
      <span className="vf-metric-unit">{unit}</span>
      <svg
        className="vf-metric-spark"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polyline
          points={pts}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function TeamSticker({
  name,
  tournament,
  points,
  members,
  role,
  palette,
  rotate,
}: {
  name: string;
  tournament: string;
  points: number;
  members: number;
  role: "captain" | "member" | "rival";
  palette: Palette;
  rotate: number;
}) {
  return (
    <div
      className={`vf-team vf-team--${palette}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="vf-team-strip">
        <span className="vf-team-role">
          {role === "captain" ? "★ CAPTAIN" : "MEMBER"}
        </span>
        <span className="vf-team-pts">
          {points}
          <span className="vf-team-pts-label">pts</span>
        </span>
      </div>
      <h3 className="vf-team-name">{name}</h3>
      <p className="vf-team-tour">{tournament}</p>
      <div className="vf-team-foot">
        <span>
          {members} member{members === 1 ? "" : "s"}
        </span>
        <span aria-hidden>→</span>
      </div>
    </div>
  );
}

function Polaroid({
  sticker,
  stickerColor,
  title,
  sub,
  time,
  cta1,
  cta2,
}: {
  sticker: string;
  stickerColor: Palette;
  title: string;
  sub: string;
  time: string;
  cta1?: string;
  cta2?: string;
}) {
  return (
    <div className="vf-polaroid">
      <div className={`vf-sticker vf-sticker--${stickerColor}`}>{sticker}</div>
      <div className="vf-polaroid-body">
        <h4 className="vf-polaroid-title">{title}</h4>
        <p className="vf-polaroid-sub">{sub}</p>
        <div className="vf-polaroid-foot">
          <span className="vf-polaroid-time">{time}</span>
          {(cta1 || cta2) && (
            <div className="vf-polaroid-ctas">
              {cta1 && <button className="vf-btn vf-btn--pink">{cta1}</button>}
              {cta2 && <button className="vf-btn">{cta2}</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RisoCard({
  label,
  name,
  role,
  members,
  points,
  progress,
  palette,
  rotate,
}: {
  label: string;
  name: string;
  role: "captain" | "member" | "rival";
  members: number;
  points: number;
  progress: number;
  palette: Palette;
  rotate: number;
}) {
  return (
    <div
      className={`vf-riso-card vf-riso-card--${palette}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="vf-riso-card-eyebrow">{label}</div>
      <div className="vf-sticker vf-sticker--${palette} vf-riso-sticker">
        {role === "captain" ? "★ CAPTAIN" : "MEMBER"}
      </div>
      <h4 className="vf-riso-card-name">{name}</h4>
      <div className="vf-riso-card-stats">
        <span>{members} members</span>
        <span className="vf-riso-card-pts">{points} pts</span>
      </div>
      <div className="vf-riso-card-progress-label">tournament progress</div>
      <div className="vf-riso-card-track">
        <div
          className="vf-riso-card-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function TrophySvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="28" y="60" width="24" height="6" rx="2" fill="currentColor" />
      <rect x="22" y="66" width="36" height="6" rx="2" fill="currentColor" />
      <path
        d="M16 14 H64 V42 C64 56 52 62 40 62 C28 62 16 56 16 42 Z"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M16 22 C8 22 6 38 16 42"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M64 22 C72 22 74 38 64 42"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 32 L40 24 L46 32 L54 33 L48 39 L50 47 L40 43 L30 47 L32 39 L26 33 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Scribbles() {
  return (
    <svg className="vf-scribbles" aria-hidden viewBox="0 0 800 800">
      {/* corner squiggle */}
      <path
        d="M40 60 Q60 30 90 60 T140 60 T190 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* dots */}
      <circle cx="730" cy="80" r="4" fill="currentColor" />
      <circle cx="745" cy="95" r="4" fill="currentColor" />
      <circle cx="760" cy="80" r="4" fill="currentColor" />
      <circle cx="745" cy="65" r="4" fill="currentColor" />
      {/* star */}
      <path
        d="M720 720 l 6 -18 l 6 18 l 18 6 l -18 6 l -6 18 l -6 -18 l -18 -6 z"
        fill="currentColor"
      />
      {/* arrow */}
      <path
        d="M30 700 q 80 -60 200 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M220 690 l 14 10 l -16 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BigDoodle() {
  return (
    <svg className="vf-doodle" aria-hidden viewBox="0 0 220 60">
      <path
        d="M5 30 Q 30 5 55 30 T 105 30 T 155 30 T 205 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function VariantFStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Caveat:wght@500;700&display=swap');

        /* ── Keyframes ── */
        @keyframes vf-fade-up {
          from { opacity: 0; transform: translateY(8px) rotate(0.3deg); }
          to   { opacity: 1; transform: translateY(0) rotate(0deg); }
        }

        @keyframes vf-bar-grow {
          from { width: 0; }
          to   { width: var(--vf-bar-target, 0%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .vf-entry { animation: none !important; opacity: 1 !important; }
          .vf-pts-bar-fill { animation: none !important; width: var(--vf-bar-target, 0%) !important; }
        }

        .variant-f {
          --vf-paper: #f7eed8;
          --vf-paper-2: #fff6df;
          --vf-ink: #181412;
          --vf-mute: #6a635a;
          --vf-pink: #ff3e88;
          --vf-cobalt: #2d5fff;
          --vf-butter: #ffd84d;
          --vf-mint: #79e6c5;
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          color: var(--vf-ink);
        }

        .vf-zine {
          position: relative;
          background: var(--vf-paper);
          padding: 2rem 2rem 1.5rem;
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          overflow: hidden;
          isolation: isolate;
        }

        .vf-grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.25;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.45 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        .vf-scribbles {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          color: var(--vf-ink);
          opacity: 0.55;
        }

        .vf-zine > *:not(.vf-grain):not(.vf-scribbles) {
          position: relative;
          z-index: 2;
        }

        /* Entry animations — staggered fade-up per section */
        .vf-entry {
          animation: vf-fade-up 420ms ease both;
        }
        .vf-entry--0  { animation-delay:   0ms; }
        .vf-entry--1  { animation-delay: 100ms; }
        .vf-entry--2  { animation-delay: 180ms; }
        .vf-entry--3  { animation-delay: 240ms; }
        .vf-entry--4  { animation-delay: 300ms; }
        .vf-entry--5  { animation-delay: 360ms; }
        .vf-entry--6  { animation-delay: 420ms; }
        .vf-entry--7  { animation-delay: 480ms; }
        .vf-entry--8  { animation-delay: 540ms; }
        .vf-entry--9  { animation-delay: 600ms; }
        .vf-entry--10 { animation-delay: 660ms; }

        /* Cover ---------------------------------------------------------- */
        .vf-cover { margin-bottom: 2rem; }
        .vf-cover-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.1rem;
        }
        .vf-stamp {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 0.3rem 0.6rem;
          border: 2px solid var(--vf-ink);
          border-radius: 999px;
          background: var(--vf-paper-2);
          transform: rotate(-2deg);
        }
        .vf-stamp:nth-child(2) { transform: rotate(1.5deg); }
        .vf-stamp:nth-child(3) { transform: rotate(-1deg); }
        .vf-stamp--yellow { background: var(--vf-butter); }
        .vf-stamp--mint { background: var(--vf-mint); }
        .vf-stamp--pink { background: var(--vf-pink); color: var(--vf-paper); border-color: var(--vf-ink); }

        .vf-cover-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-variation-settings: 'opsz' 96;
          font-size: clamp(3rem, 9vw, 6.5rem);
          line-height: 0.92;
          letter-spacing: -0.045em;
          margin: 0;
          text-transform: lowercase;
        }
        .vf-name {
          background: var(--vf-pink);
          color: var(--vf-paper);
          padding: 0 0.2em;
          display: inline-block;
          transform: rotate(-1.5deg);
          margin: 0 0.05em;
        }
        .vf-wave {
          color: var(--vf-cobalt);
          display: inline-block;
          transform: translateY(-0.12em);
        }
        .vf-bang {
          color: var(--vf-cobalt);
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 1.2em;
          display: inline-block;
          transform: rotate(8deg) translateY(0.05em);
        }
        .vf-cover-sub {
          font-size: 1.05rem;
          color: var(--vf-mute);
          margin: 1rem 0 0.4rem;
          max-width: 36em;
          font-weight: 500;
        }
        .vf-doodle {
          width: 200px;
          color: var(--vf-cobalt);
          display: block;
          margin: 0.4rem 0 0 -0.3rem;
        }

        /* Tiles ---------------------------------------------------------- */
        .vf-tiles {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 700px) {
          .vf-tiles { grid-template-columns: repeat(4, 1fr); }
        }
        .vf-tile {
          border: 3px solid var(--vf-ink);
          padding: 1.1rem 1rem 0.9rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.1rem;
          position: relative;
          box-shadow: 5px 5px 0 0 var(--vf-ink);
          transition: transform 160ms ease;
        }
        .vf-tile:hover {
          transform: translate(-2px, -2px);
          box-shadow: 7px 7px 0 0 var(--vf-ink);
        }
        .vf-tile--square { border-radius: 4px; transform: rotate(-1deg); }
        .vf-tile--circle { border-radius: 36px; transform: rotate(1deg); }
        .vf-tile--cobalt { background: var(--vf-cobalt); color: var(--vf-paper); }
        .vf-tile--pink { background: var(--vf-pink); color: var(--vf-paper); }
        .vf-tile--butter { background: var(--vf-butter); color: var(--vf-ink); }
        .vf-tile--mint { background: var(--vf-mint); color: var(--vf-ink); }
        .vf-tile-num {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 3.4rem;
          line-height: 0.9;
          letter-spacing: -0.045em;
          font-variant-numeric: tabular-nums;
        }
        .vf-tile-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.9;
        }

        /* Metric cards --------------------------------------------------- */
        .vf-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        @media (min-width: 700px) {
          .vf-metrics { grid-template-columns: repeat(4, 1fr); }
        }
        .vf-metric {
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          padding: 0.9rem 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          box-shadow: 5px 5px 0 0 var(--vf-ink);
          position: relative;
          overflow: hidden;
          transition: transform 160ms ease;
        }
        .vf-metric:hover {
          transform: translate(-2px, -2px) !important;
          box-shadow: 7px 7px 0 0 var(--vf-ink);
        }
        .vf-metric--cobalt { background: var(--vf-cobalt); color: var(--vf-paper); }
        .vf-metric--pink   { background: var(--vf-pink);   color: var(--vf-paper); }
        .vf-metric--butter { background: var(--vf-butter); color: var(--vf-ink);   }
        .vf-metric--mint   { background: var(--vf-mint);   color: var(--vf-ink);   }
        .vf-metric-rule {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: var(--vf-ink);
        }
        .vf-metric-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 0.45rem;
          opacity: 0.85;
        }
        .vf-metric-value {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 3rem;
          line-height: 0.9;
          letter-spacing: -0.045em;
          font-variant-numeric: tabular-nums;
        }
        .vf-metric-unit {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.75;
        }
        .vf-metric-spark {
          width: 100%;
          height: 36px;
          margin-top: 0.3rem;
          opacity: 0.55;
          display: block;
        }

        /* Admin pull quote ----------------------------------------------- */
        .vf-admin-quote {
          background: var(--vf-paper-2);
          border: 3px solid var(--vf-ink);
          border-radius: 6px;
          padding: 1.3rem 1.4rem;
          margin-bottom: 2.5rem;
          display: grid;
          grid-template-columns: 4rem 1fr;
          gap: 1rem;
          box-shadow: 6px 6px 0 0 var(--vf-cobalt);
          transform: rotate(-0.4deg);
        }
        .vf-quote-mark {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 3.6rem;
          line-height: 1;
          color: var(--vf-pink);
        }
        .vf-quote-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vf-mute);
          margin-bottom: 0.6rem;
        }
        .vf-quote-stats {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.6rem;
        }
        @media (min-width: 700px) {
          .vf-quote-stats { grid-template-columns: repeat(3, 1fr); }
        }
        .vf-quote-stats li {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
        }
        .vf-num {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 2.2rem;
          letter-spacing: -0.04em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .vf-num-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.05em;
        }
        .vf-num-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          color: var(--vf-mute);
        }

        /* Section -------------------------------------------------------- */
        .vf-section { margin-bottom: 2.5rem; }
        .vf-h {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 2.2rem;
          letter-spacing: -0.035em;
          line-height: 1;
          margin: 0 0 1.2rem;
          text-transform: lowercase;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .vf-h-marker {
          color: var(--vf-pink);
          font-size: 1.8rem;
          transform: rotate(-8deg);
          display: inline-block;
        }

        /* MVP card ------------------------------------------------------- */
        .vf-mvp {
          background: var(--vf-paper-2);
          border: 3px solid var(--vf-ink);
          border-radius: 6px;
          padding: 1.4rem 1.5rem;
          box-shadow: 6px 6px 0 0 var(--vf-pink);
          display: flex;
          gap: 1.4rem;
          align-items: flex-start;
          transform: rotate(-0.5deg);
          transition: transform 160ms ease;
        }
        .vf-mvp:hover { transform: rotate(0deg); box-shadow: 8px 8px 0 0 var(--vf-pink); }
        .vf-mvp-trophy {
          width: 80px;
          flex-shrink: 0;
          color: var(--vf-butter);
        }
        .vf-mvp-body { display: flex; flex-direction: column; gap: 0.4rem; }
        .vf-mvp-badge { margin-bottom: 0.2rem; }
        .vf-mvp-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 2.2rem;
          letter-spacing: -0.04em;
          line-height: 1;
          margin: 0;
        }
        .vf-mvp-detail {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.82rem;
          color: var(--vf-mute);
          margin: 0;
        }
        .vf-mvp-cta { display: inline-block; margin-top: 0.4rem; }

        /* Tale of the tape / Rival --------------------------------------- */
        .vf-tape {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
        }
        @media (max-width: 600px) {
          .vf-tape { grid-template-columns: 1fr; }
        }
        .vf-riso-card {
          border: 3px solid var(--vf-ink);
          border-radius: 6px;
          padding: 1rem 1.1rem;
          box-shadow: 6px 6px 0 0 var(--vf-ink);
          transition: transform 160ms ease;
        }
        .vf-riso-card:hover {
          transform: rotate(0deg) !important;
          box-shadow: 8px 8px 0 0 var(--vf-ink);
        }
        .vf-riso-card--pink   { background: var(--vf-pink);   color: var(--vf-paper); }
        .vf-riso-card--cobalt { background: var(--vf-cobalt); color: var(--vf-paper); }
        .vf-riso-card--butter { background: var(--vf-butter); color: var(--vf-ink);   }
        .vf-riso-card--mint   { background: var(--vf-mint);   color: var(--vf-ink);   }
        .vf-riso-card-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0.8;
          margin-bottom: 0.3rem;
        }
        .vf-riso-sticker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.2rem 0.45rem;
          border: 2px solid currentColor;
          border-radius: 3px;
          display: inline-block;
          transform: rotate(-2deg);
          margin-bottom: 0.4rem;
          opacity: 0.9;
        }
        .vf-riso-card-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin: 0 0 0.4rem;
        }
        .vf-riso-card-stats {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }
        .vf-riso-card-pts {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
        }
        .vf-riso-card-progress-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 0.25rem;
        }
        .vf-riso-card-track {
          background: rgba(0,0,0,0.18);
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
        }
        .vf-riso-card-fill {
          height: 100%;
          background: currentColor;
          opacity: 0.7;
          border-radius: 999px;
          transition: width 600ms ease;
        }
        .vf-tape-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .vf-tape-vs-label {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 2.8rem;
          letter-spacing: -0.06em;
          line-height: 1;
          background: var(--vf-butter);
          color: var(--vf-ink);
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          padding: 0.1rem 0.5rem;
          box-shadow: 4px 4px 0 0 var(--vf-ink);
          transform: rotate(-3deg);
          display: block;
        }
        .vf-tape-delta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--vf-mute);
          text-align: center;
        }

        /* League standings table ----------------------------------------- */
        .vf-standings {
          overflow-x: auto;
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          box-shadow: 6px 6px 0 0 var(--vf-cobalt);
          background: var(--vf-paper-2);
        }
        .vf-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.8rem;
        }
        .vf-table th {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 500;
          padding: 0.6rem 0.75rem;
          text-align: left;
          border-bottom: 3px solid var(--vf-ink);
          background: var(--vf-ink);
          color: var(--vf-paper);
        }
        .vf-table td {
          padding: 0.55rem 0.75rem;
          border-bottom: 1px dashed var(--vf-ink);
          vertical-align: middle;
        }
        .vf-table tr:last-child td { border-bottom: none; }
        .vf-table tr:hover td { background: rgba(255,62,136,0.06); }
        .vf-rank-stamp {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.04em;
          display: inline-block;
          transform: rotate(-3deg);
          color: var(--vf-pink);
        }
        .vf-table-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 0.98rem;
          letter-spacing: -0.02em;
          display: block;
        }
        .vf-cap-star {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          background: var(--vf-butter);
          color: var(--vf-ink);
          border: 1.5px solid var(--vf-ink);
          border-radius: 3px;
          padding: 0.1rem 0.35rem;
          display: inline-block;
          transform: rotate(-2deg);
          margin-left: 0.3rem;
        }
        .vf-table-tour {
          font-size: 0.72rem;
          color: var(--vf-mute);
          max-width: 10rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vf-table-mono {
          font-variant-numeric: tabular-nums;
          text-align: center;
        }
        .vf-role-chip {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          padding: 0.15rem 0.45rem;
          border: 1.5px solid var(--vf-ink);
          border-radius: 999px;
          text-transform: uppercase;
          display: inline-block;
        }
        .vf-role-chip--pink { background: var(--vf-pink); color: var(--vf-paper); }
        .vf-role-chip--mint { background: var(--vf-mint); color: var(--vf-ink); }
        .vf-pts-bar {
          position: relative;
          background: rgba(0,0,0,0.08);
          border: 1.5px solid var(--vf-ink);
          border-radius: 3px;
          height: 22px;
          min-width: 120px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .vf-pts-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          border-radius: 2px;
          width: 0;
          animation: vf-bar-grow 700ms ease forwards;
        }
        .vf-pts-bar-fill--cobalt { background: var(--vf-cobalt); opacity: 0.75; }
        .vf-pts-bar-fill--pink   { background: var(--vf-pink);   opacity: 0.75; }
        .vf-pts-bar-fill--butter { background: var(--vf-butter); opacity: 0.85; }
        .vf-pts-bar-fill--mint   { background: var(--vf-mint);   opacity: 0.85; }
        .vf-pts-bar-num {
          position: relative;
          z-index: 1;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.72rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          padding-left: 0.45rem;
          color: var(--vf-ink);
        }

        /* Today's lineup ------------------------------------------------- */
        .vf-lineup {
          background: var(--vf-paper-2);
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          box-shadow: 6px 6px 0 0 var(--vf-butter);
          overflow: hidden;
        }
        .vf-lineup-row {
          display: grid;
          grid-template-columns: 2.8rem 1fr auto auto auto;
          gap: 0.6rem;
          align-items: center;
          padding: 0.6rem 0.9rem;
          border-bottom: 2px dashed var(--vf-ink);
        }
        .vf-lineup-row:last-child { border-bottom: none; }
        .vf-jersey {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 999px;
          border: 2.5px solid var(--vf-ink);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: -0.04em;
          box-shadow: 3px 3px 0 0 var(--vf-ink);
          flex-shrink: 0;
        }
        .vf-jersey--cobalt { background: var(--vf-cobalt); color: var(--vf-paper); }
        .vf-jersey--pink   { background: var(--vf-pink);   color: var(--vf-paper); }
        .vf-jersey--butter { background: var(--vf-butter); color: var(--vf-ink);   }
        .vf-jersey--mint   { background: var(--vf-mint);   color: var(--vf-ink);   }
        .vf-lineup-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          letter-spacing: -0.025em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vf-lineup-pts {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.03em;
          white-space: nowrap;
        }
        .vf-lineup-pts-unit {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          margin-left: 0.2rem;
          opacity: 0.7;
        }
        .vf-lineup-members {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.72rem;
          color: var(--vf-mute);
          white-space: nowrap;
        }

        /* Team collage --------------------------------------------------- */
        .vf-collage {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 700px) {
          .vf-collage { grid-template-columns: repeat(2, 1fr); }
        }
        .vf-team {
          border: 3px solid var(--vf-ink);
          border-radius: 6px;
          padding: 0.85rem 1rem 0.95rem;
          box-shadow: 6px 6px 0 0 var(--vf-ink);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .vf-team:hover {
          transform: translate(-2px, -2px) rotate(0deg) !important;
          box-shadow: 8px 8px 0 0 var(--vf-ink);
        }
        .vf-team--cobalt { background: var(--vf-cobalt); color: var(--vf-paper); }
        .vf-team--pink { background: var(--vf-pink); color: var(--vf-paper); }
        .vf-team--butter { background: var(--vf-butter); color: var(--vf-ink); }
        .vf-team--mint { background: var(--vf-mint); color: var(--vf-ink); }
        .vf-team-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }
        .vf-team-pts {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 1.6rem;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .vf-team-pts-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          margin-left: 0.2rem;
          opacity: 0.8;
        }
        .vf-team-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 1.7rem;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin: 0 0 0.15rem;
        }
        .vf-team-tour {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.8rem;
          opacity: 0.85;
          margin: 0 0 0.85rem;
        }
        .vf-team-foot {
          display: flex;
          justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          border-top: 2px dashed currentColor;
          padding-top: 0.5rem;
        }

        /* Drop box ------------------------------------------------------- */
        .vf-dropbox {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.95rem;
        }
        @media (min-width: 700px) {
          .vf-dropbox { grid-template-columns: repeat(2, 1fr); }
        }
        .vf-polaroid {
          background: var(--vf-paper-2);
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          padding: 0.5rem 0.6rem 0.85rem;
          box-shadow: 5px 5px 0 0 var(--vf-ink);
          position: relative;
        }
        .vf-polaroid:nth-child(odd) { transform: rotate(-0.8deg); }
        .vf-polaroid:nth-child(even) { transform: rotate(0.9deg); }
        .vf-sticker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.25rem 0.55rem;
          border: 2px solid var(--vf-ink);
          border-radius: 3px;
          display: inline-block;
          transform: rotate(-3deg);
          margin-bottom: 0.5rem;
        }
        .vf-sticker--pink { background: var(--vf-pink); color: var(--vf-paper); }
        .vf-sticker--cobalt { background: var(--vf-cobalt); color: var(--vf-paper); }
        .vf-sticker--butter { background: var(--vf-butter); color: var(--vf-ink); }
        .vf-sticker--mint { background: var(--vf-mint); color: var(--vf-ink); }
        .vf-polaroid-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 1.3rem;
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin: 0.1rem 0 0.15rem;
        }
        .vf-polaroid-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          color: var(--vf-mute);
          margin: 0 0 0.7rem;
        }
        .vf-polaroid-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .vf-polaroid-time {
          font-family: 'Caveat', cursive;
          font-size: 1.2rem;
          color: var(--vf-cobalt);
        }
        .vf-polaroid-ctas { display: flex; gap: 0.35rem; }

        .vf-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: lowercase;
          padding: 0.35rem 0.75rem;
          background: var(--vf-paper);
          color: var(--vf-ink);
          border: 2px solid var(--vf-ink);
          border-radius: 999px;
          cursor: pointer;
          transition: transform 120ms ease;
        }
        .vf-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--vf-ink); }
        .vf-btn--pink { background: var(--vf-pink); color: var(--vf-paper); }

        /* Feed ----------------------------------------------------------- */
        .vf-feed {
          background: var(--vf-paper-2);
          border: 3px solid var(--vf-ink);
          border-radius: 4px;
          padding: 0.5rem 0.9rem;
          box-shadow: 5px 5px 0 0 var(--vf-mint);
        }
        .vf-feed-strip {
          display: grid;
          grid-template-columns: 4.2rem auto 1fr;
          gap: 0.5rem;
          padding: 0.45rem 0;
          border-bottom: 1px dashed var(--vf-ink);
          align-items: baseline;
        }
        .vf-feed-strip:last-child { border-bottom: none; }
        .vf-feed-time {
          font-family: 'Caveat', cursive;
          font-size: 1.15rem;
          color: var(--vf-pink);
          letter-spacing: 0.01em;
        }
        .vf-feed-perf {
          font-family: 'IBM Plex Mono', monospace;
          color: var(--vf-mute);
          letter-spacing: 0.15em;
        }
        .vf-feed-text {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 500;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
        }

        /* Colophon ------------------------------------------------------- */
        .vf-colophon {
          margin-top: 1rem;
          border-top: 3px dashed var(--vf-ink);
          padding-top: 0.7rem;
          display: flex;
          justify-content: center;
          gap: 0.7rem;
          flex-wrap: wrap;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--vf-mute);
        }
      `,
      }}
    />
  );
}
