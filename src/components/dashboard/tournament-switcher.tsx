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
        className={`border-ink bg-chip dark:bg-chip text-ink hover:bg-chip dark:hover:bg-chip shadow-fd-xs !h-auto w-fit gap-[0.5rem] rounded-full border-2 px-[0.75rem] py-[0.25rem] focus-visible:ring-0 ${className ?? ""}`}
      >
        <span className="text-mute text-label-caps font-heading font-extrabold">
          {label}
        </span>
        <span className="text-ink text-body-sm font-semibold">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="border-ink bg-chip text-ink shadow-fd-sm w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] rounded-2xl border-2"
      >
        {tournaments.map((t) => (
          <SelectItem
            key={t._id}
            value={t._id}
            className="text-ink focus:bg-ink/10 text-body-sm font-semibold"
          >
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
