import {
  RibbonBanner,
  type VariantASquadsSlotContext,
} from "./dashboard-variant-a";

/**
 * Field-Day rivals view, "Versus Ledger" style.
 * Vertical ledger of YOU-vs-RIVAL rows. Each row is a tug-of-war bar
 * anchored at the centre — fill extends left (rival ahead) or right
 * (you ahead), scaled to the widest gap on the board.
 */
export function RivalsVersusLedger({
  selectedTournamentTeams,
  selectedUserTeam,
  activities,
}: VariantASquadsSlotContext) {
  if (!selectedUserTeam) return null;

  const rivals = selectedTournamentTeams.filter(
    (t) => t.team._id !== selectedUserTeam.team._id,
  );
  if (rivals.length === 0) return null;

  const rows = rivals
    .map((r) => ({
      team: r,
      delta: selectedUserTeam.team.points - r.team.points,
    }))
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);
  const youInitials = initials(selectedUserTeam.team.name);

  const today = new Date();
  const last5 = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (4 - i));
    return d.toISOString().slice(0, 10);
  });
  const pips = (name: string): boolean[] =>
    last5.map((d) =>
      activities.some(
        (a) =>
          a.type === "submission_approved" &&
          a.description.includes(name) &&
          new Date(a.timestamp).toISOString().slice(0, 10) === d,
      ),
    );

  return (
    <section className="va-section">
      <RibbonBanner label="RIVALS · VERSUS LEDGER" small />
      <div className="border-fd-ink bg-fd-paper rounded-2xl border-2 px-[18px] py-3.5 shadow-[4px_4px_0_0_var(--fd-ink)]">
        <div
          className="text-fd-ink/60 mb-2 grid grid-cols-[56px_minmax(0,1fr)_auto] items-center font-['DM_Mono'] text-[10px] tracking-[0.12em]"
          aria-hidden
        >
          <span className="text-center">THEY LEAD</span>
          <span className="text-center opacity-80">YOU</span>
          <span className="text-center">YOU LEAD</span>
        </div>

        {rows.map(({ team: t, delta }, idx) => {
          const ahead = delta >= 0;
          const ratio = Math.min(Math.abs(delta) / maxAbs, 1);
          const fillPct = ratio * 50;
          return (
            <div
              key={t.team._id}
              className="border-fd-ink/25 grid grid-cols-[36px_1fr_2fr_auto] items-center gap-3.5 border-t border-dashed py-3 first:border-t-0 max-[720px]:grid-cols-[32px_1fr_auto]"
            >
              <div className="bg-fd-ink text-fd-paper rounded-full px-2 py-0.5 text-center font-['DM_Mono'] text-[12px] tracking-[0.08em]">
                #{idx + 2}
              </div>

              <div>
                <div className="text-fd-ink font-['Funnel_Display'] text-[17px] leading-[1.1] font-bold">
                  {t.team.name}
                </div>
                <div className="text-fd-ink/60 mt-0.5 font-['DM_Mono'] text-[10px] tracking-[0.1em] uppercase">
                  {t.team.points} pts · {t.memberCount} member
                  {t.memberCount === 1 ? "" : "s"}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2.5 max-[720px]:col-span-full">
                <div className="border-fd-ink relative h-[22px] overflow-hidden rounded-full border-2 bg-[color-mix(in_srgb,var(--fd-ink)_8%,var(--fd-paper))]">
                  <div
                    className="bg-fd-ink/45 absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
                    aria-hidden
                  />
                  <div
                    className={[
                      "absolute inset-y-0.5 rounded-full",
                      ahead ? "bg-fd-grass" : "bg-fd-sunset",
                    ].join(" ")}
                    style={
                      ahead
                        ? { left: "50%", width: `${fillPct}%` }
                        : { left: `${50 - fillPct}%`, width: `${fillPct}%` }
                    }
                  />
                  <div
                    className="border-fd-ink bg-fd-gold text-fd-ink absolute top-1/2 left-1/2 grid h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-['DM_Mono'] text-[10px] font-extrabold shadow-[1px_1px_0_0_var(--fd-ink)]"
                    aria-hidden
                  >
                    {youInitials}
                  </div>
                </div>
                <div
                  className={[
                    "min-w-12 text-right font-['DM_Mono'] text-[14px] font-extrabold",
                    ahead ? "text-fd-grass" : "text-fd-sunset",
                  ].join(" ")}
                >
                  {ahead ? "+" : "−"}
                  {Math.abs(delta)}
                </div>
              </div>

              <div
                className="inline-flex gap-1 max-[720px]:col-span-full max-[720px]:justify-end"
                aria-label="5-day form"
              >
                {pips(t.team.name).map((on, i) => (
                  <span
                    key={i}
                    className={[
                      "h-2.5 w-2.5 rounded-full border-2 border-fd-ink",
                      on
                        ? "bg-fd-ink opacity-100"
                        : "bg-transparent opacity-55",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
