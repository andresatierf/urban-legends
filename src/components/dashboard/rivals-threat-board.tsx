import {
  RibbonBanner,
  type VariantASquadsSlotContext,
} from "./dashboard-variant-a";

/**
 * Field-Day rivals view, "Threat Board" style.
 * Grid of rival cards, each with a colour-coded delta chip vs the user's
 * team, plus a 7-day form sparkline. Sorted by closest threat first.
 */
export function RivalsThreatBoard({
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

  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const form = (name: string): number[] =>
    last7.map(
      (d) =>
        activities.filter(
          (a) =>
            a.type === "submission_approved" &&
            a.description.includes(name) &&
            new Date(a.timestamp).toISOString().slice(0, 10) === d,
        ).length,
    );

  return (
    <section className="va-section">
      <RibbonBanner label="RIVALS · THREAT BOARD" small />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {sorted.map(({ team: t, delta }, idx) => {
          const ahead = delta >= 0;
          const f = form(t.team.name);
          const max = Math.max(...f, 1);
          return (
            <article
              key={t.team._id}
              className={[
                "relative flex flex-col gap-3 rounded-2xl border-2 border-fd-ink p-4 shadow-[4px_4px_0_0_var(--fd-ink)]",
                ahead
                  ? "bg-[color-mix(in_srgb,var(--fd-grass)_12%,var(--fd-paper))]"
                  : "bg-[color-mix(in_srgb,var(--fd-sunset)_14%,var(--fd-paper))]",
              ].join(" ")}
            >
              <div className="bg-fd-ink text-fd-paper absolute -top-2.5 left-3.5 rounded-full px-2 py-0.5 font-['DM_Mono'] text-[11px] tracking-[0.08em]">
                #{idx + 2}
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="text-fd-ink font-['Funnel_Display'] text-[20px] leading-[1.1] font-extrabold">
                  {t.team.name}
                </div>
                <div className="text-fd-ink/70 font-['DM_Mono'] text-[11px] tracking-[0.1em] uppercase">
                  {t.memberCount} member{t.memberCount === 1 ? "" : "s"}
                </div>
              </div>

              <div
                className={[
                  "inline-flex items-center gap-1.5 self-start rounded-full border-2 border-fd-ink px-2.5 py-1 font-['DM_Mono'] text-[13px] font-bold text-fd-paper",
                  ahead ? "bg-fd-grass" : "bg-fd-sunset",
                ].join(" ")}
                aria-label={
                  ahead
                    ? `Ahead of them by ${delta}`
                    : `Behind by ${Math.abs(delta)}`
                }
              >
                <span>{ahead ? "▲" : "▼"}</span>
                <span className="text-[15px]">
                  {ahead ? "+" : "−"}
                  {Math.abs(delta)}
                </span>
                <span className="text-[10px] tracking-[0.1em] opacity-90">
                  {ahead ? "YOU LEAD" : "THEY LEAD"}
                </span>
              </div>

              <div className="grid grid-cols-[auto_1fr] items-end gap-4">
                <div>
                  <div className="text-fd-ink/65 font-['DM_Mono'] text-[10px] tracking-[0.12em] uppercase">
                    POINTS
                  </div>
                  <div className="text-fd-ink font-['Funnel_Display'] text-[26px] leading-none font-extrabold">
                    {t.team.points}
                  </div>
                </div>
                <div>
                  <div className="text-fd-ink/65 font-['DM_Mono'] text-[10px] tracking-[0.12em] uppercase">
                    7D FORM
                  </div>
                  <div
                    className="flex h-7 items-end gap-[3px] py-0.5"
                    aria-hidden
                  >
                    {f.map((v, i) => (
                      <span
                        key={i}
                        className="bg-fd-ink/85 min-h-[2px] flex-1 rounded-[2px]"
                        style={{ height: `${(v / max) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
