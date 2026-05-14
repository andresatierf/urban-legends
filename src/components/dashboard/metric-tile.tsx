import { RunnerSvg, WhistleSvgSmall } from "./svg-icons";
import type { DashboardTeam } from "./types";

export function MetricTile({
  label,
  value,
  unit,
  color,
  sparkline,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  sparkline: number[];
}) {
  const w = 60;
  const h = 20;
  const max = Math.max(...sparkline, 1);
  const pts = sparkline
    .map((v, i) => {
      const x = (i / Math.max(sparkline.length - 1, 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div
      className="border-ink bg-card flex flex-col gap-[0.2rem] overflow-hidden rounded-[16px] border-2 p-4 shadow-[5px_5px_0_var(--shadow)] transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--shadow)]"
      style={{ "--metric-accent": color } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="-mx-4 -mt-1 mb-[0.6rem] h-1 rounded-[2px] [background:repeating-linear-gradient(90deg,var(--metric-accent,var(--gold))_0px,var(--metric-accent,var(--gold))_8px,transparent_8px,transparent_14px)]"
      />
      <span className="text-mute text-label-caps text-[0.6rem]">
        {label}
      </span>
      <span className="text-ink text-display text-[2.4rem]">{value}</span>
      <span className="text-mute text-label-caps mb-[0.4rem] text-[0.6rem]">
        {unit}
      </span>
      <svg
        aria-hidden
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="mt-auto"
      >
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function RosetteTile({
  team,
  label,
  highlight,
}: {
  team: DashboardTeam;
  label: string;
  highlight?: boolean;
}) {
  const now = Date.now();
  const start = new Date(team.tournament.startDate).getTime();
  const end = new Date(team.tournament.endDate).getTime();
  const progress = Math.round(
    (Math.min(Math.max(now - start, 0), end - start) /
      Math.max(end - start, 1)) *
      100,
  );
  return (
    <div
      className={`border-ink bg-card flex flex-1 flex-col items-center rounded-[22px] border-2 p-6 text-center shadow-[6px_6px_0_var(--shadow)] transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--shadow)] ${highlight ? "border-gold bg-[rgba(255,200,71,0.15)]" : ""}`}
    >
      <div className="text-mute text-label-caps mb-[0.35rem] text-[0.6rem]">
        {label}
      </div>
      <div className="text-ink font-heading mb-[0.35rem] text-[1.3rem] leading-[1.2] font-extrabold">
        {team.team.name}
      </div>
      {team.userRole === "captain" && (
        <span
          className="border-gold text-ink text-label-caps mb-2 inline-flex items-center gap-[3px] rounded-full border-[1.5px] bg-[rgba(255,200,71,0.3)] [padding:0.15rem_0.5rem] text-[0.65rem]"
          style={{ marginBottom: "0.5rem" }}
        >
          <WhistleSvgSmall />
          Captain
        </span>
      )}
      <div className="text-ink text-metric text-[2rem]">
        {team.team.points}{" "}
        <span className="text-mute text-[0.9rem]">pts</span>
      </div>
      <div className="text-mute text-body-sm mt-1 text-[0.78rem]">
        {team.memberCount} members
      </div>
      <div
        className="border-ink bg-paper-deep relative mb-[0.3rem] h-[10px] overflow-visible rounded-full border-[1.5px]"
        style={{ marginTop: "0.75rem" }}
      >
        <div
          className="bg-grass absolute top-0 left-0 h-full rounded-full transition-[width] duration-[400ms] ease-linear"
          style={{ width: `${progress}%` }}
        />
        <RunnerSvg progress={progress} />
      </div>
      <div className="text-mute text-label-caps flex justify-between text-[0.6rem]">
        <span>Start</span>
        <span>{progress}%</span>
        <span>End</span>
      </div>
    </div>
  );
}
