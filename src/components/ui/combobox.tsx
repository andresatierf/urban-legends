import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props<T extends string> = {
  id?: string;
  name?: string;
  value: T;
  setValue: (value: T) => void;
  options: { value: T; label: string }[];
  noSelectionText?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function Combobox<T extends string>({
  id,
  name,
  value,
  setValue,
  options,
  noSelectionText = "Select...",
  placeholder = "Search...",
  disabled,
  "aria-invalid": ariaInvalid,
}: Props<T>) {
  const [open, setOpen] = useState(false);

  // TODO: add tooltip when disabled
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("grow justify-between", {
            "pointer-events-none": disabled,
          })}
          aria-invalid={ariaInvalid}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : noSelectionText}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="grow p-0">
        <Command>
          <CommandInput
            id={id}
            name={name}
            placeholder={placeholder}
            className="h-9"
            aria-invalid={ariaInvalid}
          />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    setValue(newValue as T);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
