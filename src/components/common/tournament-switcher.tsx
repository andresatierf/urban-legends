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
  allOption?: { value: string; label: string };
};

export function TournamentSwitcher({
  tournaments,
  selectedTournamentId,
  onSelect,
  label = "Viewing",
  className,
  allOption,
}: TournamentSwitcherProps) {
  if (tournaments.length <= 1 && !allOption) return null;

  const options = [
    ...(allOption
      ? [{ value: allOption.value, triggerLabel: allOption.label }]
      : []),
    ...tournaments.map((t) => ({ value: t._id, triggerLabel: t.name })),
  ];

  return (
    <PrefixedSelect
      prefix={label}
      value={selectedTournamentId}
      onValueChange={onSelect}
      options={options}
      className={className}
      hidePrefixOnMobile
    />
  );
}
