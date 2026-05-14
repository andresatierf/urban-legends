import { PrefixedSelect } from "@/components/ui/prefixed-select";

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
    <PrefixedSelect
      prefix={label}
      value={selectedTournamentId}
      onValueChange={onSelect}
      options={tournaments.map((t) => ({
        value: t._id,
        triggerLabel: t.name,
      }))}
      className={className}
    />
  );
}
