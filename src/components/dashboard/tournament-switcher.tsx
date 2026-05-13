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
    <div
      className={`border-fd-ink bg-fd-chip flex w-fit items-center gap-[0.6rem] rounded-full border-2 px-[0.9rem] py-[0.55rem] shadow-[3px_3px_0_var(--fd-shadow)] ${className ?? ""}`}
    >
      <label
        htmlFor="va-tour-select"
        className="font-fd-display text-fd-mute text-[0.72rem] font-extrabold tracking-[0.14em] uppercase"
      >
        {label}
      </label>
      <select
        id="va-tour-select"
        className="font-fd-body text-fd-ink cursor-pointer border-0 bg-transparent pr-4 text-[0.9rem] font-semibold"
        value={selectedTournamentId}
        onChange={(e) => onSelect(e.target.value)}
      >
        {tournaments.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
