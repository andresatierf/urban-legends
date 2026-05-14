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
    <div className="border-ink bg-card shadow-fd-sm flex items-start gap-3 rounded-xl border-2 p-4">
      <CheckboxSvg checked={ok} />
      <div className="flex-1">
        <div className="text-mute text-label-caps mb-[0.2rem]">{label}</div>
        <div className="text-metric mb-[0.2rem] text-3xl">
          {value}
          {unit && <span className="ml-[0.05em] text-base">{unit}</span>}
        </div>
        <div className="text-mute text-body-sm">{sub}</div>
      </div>
    </div>
  );
}
