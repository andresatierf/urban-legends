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
    <div className="border-fd-ink bg-fd-card flex items-start gap-3 rounded-[14px] border-2 p-4 shadow-[3px_3px_0_var(--fd-shadow)]">
      <CheckboxSvg checked={ok} />
      <div className="flex-1">
        <div className="text-fd-mute mb-[0.2rem] font-[Lexend] text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
          {label}
        </div>
        <div className="mb-[0.2rem] font-[DM_Mono] text-[1.8rem] leading-[1] font-medium [font-variant-numeric:tabular-nums]">
          {value}
          {unit && <span className="ml-[0.05em] text-[1rem]">{unit}</span>}
        </div>
        <div className="text-fd-mute font-[Lexend] text-[0.72rem]">{sub}</div>
      </div>
    </div>
  );
}
