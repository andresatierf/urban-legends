import {
  RibbonBanner,
  type VariantASquadsSlotContext,
} from "./dashboard-variant-a";
import { formatRelative } from "./dashboard-variant-shared";

/**
 * Field-Day rivals view, "Scouting Report" style.
 * Spotlights the PRIMARY RIVAL (closest in points) in a dossier card with
 * head-to-head stats and last actions, with the rest stacked as compact
 * contender chips below.
 */
export function RivalsScoutingReport({
  selectedTournamentTeams,
  selectedUserTeam,
  activities,
}: VariantASquadsSlotContext) {
  if (!selectedUserTeam) return null;

  const rivals = selectedTournamentTeams.filter(
    (t) => t.team._id !== selectedUserTeam.team._id,
  );
  if (rivals.length === 0) return null;

  const sorted = rivals
    .map((r) => ({
      team: r,
      delta: selectedUserTeam.team.points - r.team.points,
    }))
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

  const primary = sorted[0];
  const contenders = sorted.slice(1);

  const primaryActivities = activities
    .filter(
      (a) =>
        a.type === "submission_approved" &&
        a.description.includes(primary.team.team.name),
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const inLast7 = (ts: number) =>
    last7.includes(new Date(ts).toISOString().slice(0, 10));
  const primaryWeek = activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      a.description.includes(primary.team.team.name) &&
      inLast7(a.timestamp),
  ).length;
  const youWeek = activities.filter(
    (a) =>
      a.type === "submission_approved" &&
      a.description.includes(selectedUserTeam.team.name) &&
      inLast7(a.timestamp),
  ).length;

  const primaryAhead = primary.delta >= 0;

  return (
    <section className="va-section">
      <RibbonBanner label="RIVALS · SCOUTING REPORT" small />

      <article
        className={[
          "relative overflow-hidden rounded-2xl border-2 border-fd-ink p-[22px] pb-[18px] shadow-[5px_5px_0_0_var(--fd-ink)]",
          "before:pointer-events-none before:absolute before:inset-1.5 before:rounded-xl before:border before:border-dashed before:border-fd-ink/30",
          primaryAhead
            ? "bg-[color-mix(in_srgb,var(--fd-grass)_10%,var(--fd-paper))]"
            : "bg-[color-mix(in_srgb,var(--fd-sunset)_12%,var(--fd-paper))]",
        ].join(" ")}
      >
        <div className="border-fd-sunset bg-fd-paper text-fd-sunset absolute top-3.5 right-3.5 rotate-[4deg] rounded border-2 px-2.5 py-1 font-['DM_Mono'] text-[10px] font-extrabold tracking-[0.16em]">
          PRIMARY RIVAL
        </div>

        <div className="grid grid-cols-[160px_1fr_1fr] items-start gap-[22px] max-[880px]:grid-cols-1">
          <div
            className="flex flex-col items-center gap-2 max-[880px]:flex-row"
            aria-hidden
          >
            <span className="border-fd-ink bg-fd-gold text-fd-ink grid h-[140px] w-[140px] place-items-center rounded-full border-2 font-['Funnel_Display'] text-[56px] font-extrabold shadow-[3px_3px_0_0_var(--fd-ink)] max-[880px]:h-[88px] max-[880px]:w-[88px] max-[880px]:text-[34px]">
              {initials(primary.team.team.name)}
            </span>
            <div className="text-fd-ink/65 text-center font-['DM_Mono'] text-[10px] tracking-[0.12em]">
              CLOSEST IN POINTS
            </div>
          </div>

          <div>
            <div className="text-fd-ink font-['Funnel_Display'] text-[30px] leading-[1.05] font-extrabold">
              {primary.team.team.name}
            </div>
            <div className="text-fd-ink/65 mt-1 font-['DM_Mono'] text-[11px] tracking-[0.1em] uppercase">
              {primary.team.memberCount} member
              {primary.team.memberCount === 1 ? "" : "s"} ·{" "}
              {primary.team.team.points} pts
            </div>

            <div className="mt-3.5 flex flex-col gap-1.5">
              <H2HRow label="POINT GAP">
                <span
                  className={primaryAhead ? "text-fd-grass" : "text-fd-sunset"}
                >
                  {primaryAhead
                    ? `You +${primary.delta}`
                    : `They +${Math.abs(primary.delta)}`}
                </span>
              </H2HRow>
              <H2HRow label="THIS WEEK">
                YOU {youWeek} · THEM {primaryWeek}
              </H2HRow>
              <H2HRow label="VERDICT">
                {primaryAhead
                  ? "Hold the lead — don't ease up."
                  : "Within striking distance."}
              </H2HRow>
            </div>
          </div>

          <div className="pt-1">
            <div className="text-fd-ink/60 mb-2 font-['DM_Mono'] text-[10px] tracking-[0.14em]">
              LAST ACTIONS
            </div>
            {primaryActivities.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {primaryActivities.map((a, i) => (
                  <li
                    key={i}
                    className="border-fd-ink/20 grid grid-cols-[90px_1fr] items-baseline gap-2.5 border-b border-dashed pb-1.5 last:border-b-0"
                  >
                    <span className="text-fd-ink/55 font-['DM_Mono'] text-[11px] tracking-[0.06em]">
                      {formatRelative(a.timestamp)}
                    </span>
                    <span className="text-fd-ink text-[13px] leading-snug">
                      {a.description}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-fd-ink/55 text-[13px] italic">
                No recent approved submissions.
              </div>
            )}
          </div>
        </div>
      </article>

      {contenders.length > 0 && (
        <div className="mt-4">
          <div className="text-fd-ink/60 mb-2 font-['DM_Mono'] text-[11px] tracking-[0.16em]">
            OTHER CONTENDERS
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
            {contenders.map(({ team: t, delta }, idx) => {
              const ahead = delta >= 0;
              return (
                <div
                  key={t.team._id}
                  className="border-fd-ink bg-fd-paper grid grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 rounded-[10px] border-2 px-3 py-2.5 shadow-[2px_2px_0_0_var(--fd-ink)]"
                >
                  <span className="bg-fd-ink text-fd-paper rounded-full px-1.5 py-0.5 font-['DM_Mono'] text-[11px] font-extrabold">
                    #{idx + 3}
                  </span>
                  <span className="text-fd-ink truncate font-['Funnel_Display'] text-[14px] font-bold">
                    {t.team.name}
                  </span>
                  <span className="text-fd-ink/65 font-['DM_Mono'] text-[11px]">
                    {t.team.points} pts
                  </span>
                  <span
                    className={[
                      "rounded-full border-2 border-fd-ink px-1.5 py-0.5 font-['DM_Mono'] text-[13px] font-extrabold text-fd-paper",
                      ahead ? "bg-fd-grass" : "bg-fd-sunset",
                    ].join(" ")}
                  >
                    {ahead ? "+" : "−"}
                    {Math.abs(delta)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function H2HRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-fd-ink/25 grid grid-cols-[110px_1fr] items-baseline gap-3 border-t border-dashed py-1.5 first:border-t-0">
      <span className="text-fd-ink/60 font-['DM_Mono'] text-[10px] tracking-[0.14em] uppercase">
        {label}
      </span>
      <span className="text-fd-ink font-['Funnel_Display'] text-[16px] font-bold">
        {children}
      </span>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
