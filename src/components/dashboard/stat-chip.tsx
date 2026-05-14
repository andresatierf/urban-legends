export function StatChip({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  suffix?: string;
}) {
  return (
    <div
      className={`border-fd-ink flex flex-col gap-[0.3rem] rounded-[14px] border-2 p-4 text-center shadow-[4px_4px_0_var(--fd-shadow)] ${accent ? "border-fd-sunset bg-[rgba(255,122,69,0.12)]" : "bg-fd-paper-deep"}`}
    >
      <span className="text-fd-ink font-[DM_Mono] text-[2.2rem] leading-[1] font-medium [font-variant-numeric:tabular-nums]">
        {value}
        {suffix ? (
          <span className="text-fd-mute ml-[0.2rem] font-[DM_Mono] text-[0.85rem] font-medium tracking-[0.04em]">
            {suffix}
          </span>
        ) : null}
      </span>
      <span className="text-fd-mute font-[Lexend] text-[0.62rem] font-semibold tracking-[0.14em] uppercase">
        {label}
      </span>
    </div>
  );
}
