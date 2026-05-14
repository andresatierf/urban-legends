import { Eyebrow } from "@/components/ui/eyebrow";

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
      className="border-ink bg-card shadow-fd-md hover:shadow-fd-xl flex flex-col gap-[0.2rem] overflow-hidden rounded-xl border-2 p-4 transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{ "--metric-accent": color } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="-mx-4 -mt-1 mb-[0.6rem] h-1 rounded-xs [background:repeating-linear-gradient(90deg,var(--metric-accent,var(--gold))_0px,var(--metric-accent,var(--gold))_8px,transparent_8px,transparent_14px)]"
      />
      <Eyebrow className="text-mute">{label}</Eyebrow>
      <span className="text-ink text-display">{value}</span>
      <Eyebrow className="text-mute mb-[0.4rem]">{unit}</Eyebrow>
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
      className={`border-ink bg-card shadow-fd-lg hover:shadow-fd-xl flex flex-1 flex-col items-center rounded-2xl border-2 p-6 text-center transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 ${highlight ? "border-gold bg-gold/15" : ""}`}
    >
      <Eyebrow className="text-mute mb-[0.35rem] block">{label}</Eyebrow>
      <div className="text-ink font-heading mb-[0.35rem] text-xl leading-[1.2] font-extrabold">
        {team.team.name}
      </div>
      {team.userRole === "captain" && (
        <span className="border-gold text-ink text-label-caps bg-gold/30 mb-2 inline-flex items-center gap-[3px] rounded-full border-[1.5px] px-2 py-0.5">
          <WhistleSvgSmall />
          Captain
        </span>
      )}
      <div className="text-ink text-metric text-3xl">
        {team.team.points} <span className="text-mute text-sm">pts</span>
      </div>
      <div className="text-mute text-body-sm mt-1">
        {team.memberCount} members
      </div>
      <div className="border-ink bg-paper-deep relative mt-3 mb-[0.3rem] h-[10px] overflow-visible rounded-full border-[1.5px]">
        <div
          className="bg-grass absolute top-0 left-0 h-full rounded-full transition-[width] duration-[400ms] ease-linear"
          style={{ width: `${progress}%` }}
        />
        <RunnerSvg progress={progress} />
      </div>
      <Eyebrow className="text-mute flex justify-between" as="div">
        <span>Start</span>
        <span>{progress}%</span>
        <span>End</span>
      </Eyebrow>
    </div>
  );
}
