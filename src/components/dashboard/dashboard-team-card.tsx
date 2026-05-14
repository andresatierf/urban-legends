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
    "bg-grass",
    "bg-sky",
    "bg-sunset",
    "bg-plum",
    "bg-gold",
  ];
  const displayCount = Math.min(memberCount, 5);

  return (
    <div className="border-ink bg-card rounded-[22px] border-2 p-6 shadow-[6px_6px_0_var(--shadow)] transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--shadow)]">
      <div className="mb-[0.3rem] flex items-start justify-between gap-2">
        <div className="font-heading flex-1 text-[1.15rem] leading-[1.2] font-extrabold">
          {name}
          {isCaptain && (
            <span className="border-gold text-ink text-label-caps mt-[0.35rem] ml-[0.35rem] inline-flex items-center gap-[3px] rounded-full border-[1.5px] bg-[rgba(255,200,71,0.3)] [padding:0.15rem_0.5rem] text-[0.65rem]">
              <WhistleSvgSmall />
              Team Captain
            </span>
          )}
        </div>
        <div className="text-ink text-metric flex-shrink-0 text-[1.6rem]">
          {points}
        </div>
      </div>
      <div className="text-mute text-body-sm mb-[0.85rem] text-[0.82rem] italic">
        {tournamentName}
      </div>
      <div className="mb-4 flex items-center gap-1">
        {Array.from({ length: displayCount }).map((_, idx) => (
          <span
            key={idx}
            className={`border-card inline-block size-[26px] rounded-full border-2 shadow-[0_0_0_1.5px_var(--ink)] ${avatarColors[idx % avatarColors.length]}`}
          />
        ))}
        {memberCount > 5 && (
          <span className="text-mute ml-1 font-mono text-[0.7rem]">
            +{memberCount - 5}
          </span>
        )}
      </div>
      <div className="border-ink bg-paper-deep relative mb-[0.3rem] h-[10px] overflow-visible rounded-full border-[1.5px]">
        <div
          className="bg-grass absolute top-0 left-0 h-full rounded-full transition-[width] duration-[400ms] ease-linear"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <RunnerSvg progress={Math.min(progress, 100)} />
      </div>
      <div className="text-mute text-label-caps flex justify-between text-[0.6rem]">
        <span>Start</span>
        <span>Finish</span>
      </div>
    </div>
  );
}
