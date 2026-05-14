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
      className={`border-ink flex flex-col gap-[0.3rem] rounded-[14px] border-2 p-4 text-center shadow-[4px_4px_0_var(--shadow)] ${accent ? "border-sunset bg-[rgba(255,122,69,0.12)]" : "bg-paper-deep"}`}
    >
      <span className="text-ink text-metric text-[2.2rem]">
        {value}
        {suffix ? (
          <span className="text-mute ml-[0.2rem] text-[0.85rem] tracking-[0.04em]">
            {suffix}
          </span>
        ) : null}
      </span>
      <span className="text-mute text-label-caps text-[0.62rem]">{label}</span>
    </div>
  );
}
