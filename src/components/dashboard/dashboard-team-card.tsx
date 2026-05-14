import { RunnerSvg, WhistleSvgSmall } from "./svg-icons";

export function DashboardTeamCard({
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
    "bg-fd-grass",
    "bg-fd-sky",
    "bg-fd-sunset",
    "bg-fd-plum",
    "bg-fd-gold",
  ];
  const displayCount = Math.min(memberCount, 5);

  return (
    <div className="border-fd-ink bg-fd-card rounded-[22px] border-2 p-6 shadow-[6px_6px_0_var(--fd-shadow)] transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--fd-shadow)]">
      <div className="mb-[0.3rem] flex items-start justify-between gap-2">
        <div className="flex-1 font-[Funnel_Display] text-[1.15rem] leading-[1.2] font-extrabold">
          {name}
          {isCaptain && (
            <span className="border-fd-gold text-fd-ink mt-[0.35rem] ml-[0.35rem] inline-flex items-center gap-[3px] rounded-full border-[1.5px] bg-[rgba(255,200,71,0.3)] [padding:0.15rem_0.5rem] font-[Lexend] text-[0.65rem] font-semibold tracking-[0.08em] uppercase">
              <WhistleSvgSmall />
              Team Captain
            </span>
          )}
        </div>
        <div className="text-fd-ink flex-shrink-0 font-[DM_Mono] text-[1.6rem] leading-[1] font-medium [font-variant-numeric:tabular-nums]">
          {points}
        </div>
      </div>
      <div className="text-fd-mute mb-[0.85rem] font-[Lexend] text-[0.82rem] italic">
        {tournamentName}
      </div>
      <div className="mb-4 flex items-center gap-1">
        {Array.from({ length: displayCount }).map((_, idx) => (
          <span
            key={idx}
            className={`border-fd-card inline-block size-[26px] rounded-full border-2 shadow-[0_0_0_1.5px_var(--fd-ink)] ${avatarColors[idx % avatarColors.length]}`}
          />
        ))}
        {memberCount > 5 && (
          <span className="text-fd-mute ml-1 font-[DM_Mono] text-[0.7rem]">
            +{memberCount - 5}
          </span>
        )}
      </div>
      <div className="border-fd-ink bg-fd-paper-deep relative mb-[0.3rem] h-[10px] overflow-visible rounded-full border-[1.5px]">
        <div
          className="bg-fd-grass absolute top-0 left-0 h-full rounded-full transition-[width] duration-[400ms] ease-linear"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <RunnerSvg progress={Math.min(progress, 100)} />
      </div>
      <div className="text-fd-mute flex justify-between font-[DM_Mono] text-[0.6rem] tracking-[0.08em]">
        <span>Start</span>
        <span>Finish</span>
      </div>
    </div>
  );
}
