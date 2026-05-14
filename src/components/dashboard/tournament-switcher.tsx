import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TournamentOption = {
  _id: string;
  name: string;
};

type TournamentSwitcherProps = {
  tournaments: TournamentOption[];
  selectedTournamentId: string;
  onSelect: (tournamentId: string) => void;
  label?: string;
  className?: string;
};

export function TournamentSwitcher({
  tournaments,
  selectedTournamentId,
  onSelect,
  label = "Viewing",
  className,
}: TournamentSwitcherProps) {
  if (tournaments.length <= 1) return null;

  return (
    <Select value={selectedTournamentId} onValueChange={onSelect}>
      <SelectTrigger
        className={`border-ink bg-chip dark:bg-chip text-ink hover:bg-chip dark:hover:bg-chip !h-auto w-fit gap-[0.5rem] rounded-full border-2 px-[0.75rem] py-[0.25rem] shadow-[2px_2px_0_var(--shadow)] focus-visible:ring-0 ${className ?? ""}`}
      >
        <span className="font-fd-display text-mute text-[0.72rem] font-extrabold tracking-[0.14em] uppercase">
          {label}
        </span>
        <span className="font-fd-body text-ink text-[0.9rem] font-semibold">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="border-ink bg-chip text-ink w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] rounded-2xl border-2 shadow-[3px_3px_0_var(--shadow)]"
      >
        {tournaments.map((t) => (
          <SelectItem
            key={t._id}
            value={t._id}
            className="font-fd-body text-ink focus:bg-ink/10 text-[0.9rem] font-semibold"
          >
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
