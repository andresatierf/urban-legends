import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PrefixedSelectOption = {
  value: string;
  triggerLabel: string;
  children?: ReactNode;
};

type PrefixedSelectProps = {
  prefix: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: PrefixedSelectOption[];
  placeholder?: string;
  className?: string;
};

export function PrefixedSelect({
  prefix,
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: PrefixedSelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`border-ink bg-chip dark:bg-chip text-ink hover:bg-chip dark:hover:bg-chip shadow-fd-xs data-[state=open]:rounded-b-sm !h-auto w-fit gap-[0.5rem] rounded-full border-2 px-[0.75rem] py-[0.25rem] focus-visible:ring-0 ${className ?? ""}`}
      >
        <span className="text-mute text-label-caps font-heading font-extrabold">
          {prefix}
        </span>
        <span className="text-ink text-body-sm font-semibold">
          <SelectValue placeholder={placeholder}>
            {selected?.triggerLabel}
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="border-ink bg-chip text-ink shadow-fd-sm w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] rounded-lg rounded-t-sm border-2"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-ink! data-highlighted:bg-ink/10! data-highlighted:text-ink! focus:bg-ink/10! focus:text-ink! text-body-sm font-semibold"
          >
            {option.children ?? option.triggerLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
