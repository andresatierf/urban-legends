import { CheckboxSvg } from "./svg-icons";

export function CoachStat({
  label,
  value,
  sub,
  ok,
  unit,
}: {
  label: string;
  value: number;
  sub: string;
  ok?: boolean;
  unit?: string;
}) {
  return (
    <div className="border-ink bg-card flex items-start gap-3 rounded-[14px] border-2 p-4 shadow-[3px_3px_0_var(--shadow)]">
      <CheckboxSvg checked={ok} />
      <div className="flex-1">
        <div className="text-mute text-label-caps mb-[0.2rem] text-[0.72rem]">
          {label}
        </div>
        <div className="text-metric mb-[0.2rem] text-[1.8rem]">
          {value}
          {unit && <span className="ml-[0.05em] text-[1rem]">{unit}</span>}
        </div>
        <div className="text-mute text-body-sm text-[0.72rem]">{sub}</div>
      </div>
    </div>
  );
}
