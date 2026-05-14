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
      className={`border-ink shadow-fd flex flex-col gap-[0.3rem] rounded-xl border-2 p-4 text-center ${accent ? "border-sunset bg-sunset/12" : "bg-paper-deep"}`}
    >
      <span className="text-ink text-metric text-4xl">
        {value}
        {suffix ? (
          <span className="text-mute ml-[0.2rem] text-sm tracking-tight">
            {suffix}
          </span>
        ) : null}
      </span>
      <span className="text-mute text-label-caps">{label}</span>
    </div>
  );
}
