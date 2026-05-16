import { useStore } from "@tanstack/react-form";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useMemo } from "react";

import { useFieldContext } from "@/hooks/form-context";

import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxTrigger,
} from "../../ui/combobox";
import { Field, FieldError, FieldLabel } from "../../ui/field";

export type ComboboxFieldProps<T> = {
  label: string;
  options: { value: T; label: string }[];
  onChange?: (value: T | "") => void;
  placeholder?: string;
  children?: React.ReactNode;
};

type Option<T> = { value: T; label: string };

export function ComboboxField<T extends string>({
  label,
  options,
  onChange,
  placeholder,
  children,
}: ComboboxFieldProps<T>) {
  const field = useFieldContext<T>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === field.state.value) ?? null,
    [options, field.state.value],
  );

  const handleOnChange = useCallback(
    (option: Option<T> | null) => {
      const next = option?.value ?? ("" as T);
      field.handleChange(next);
      onChange?.(next);
    },
    [field, onChange],
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Combobox
        items={options}
        value={selectedOption}
        onValueChange={handleOnChange}
        isItemEqualToValue={(a, b) => a?.value === b?.value}
      >
        <div className="relative flex flex-col">
          <ComboboxInput
            id={field.name}
            name={field.name}
            placeholder={placeholder}
            aria-invalid={isInvalid}
            className="pr-14"
          />
          <div className="text-muted-foreground absolute right-2 bottom-0 flex h-9 items-center justify-center">
            <ComboboxClear />
            <ComboboxTrigger
              aria-label="Open popup"
              className="text-muted-foreground h-9 w-6 border-none bg-transparent shadow-none hover:bg-transparent"
            >
              <ChevronDownIcon className="size-4" />
            </ComboboxTrigger>
          </div>
        </div>

        <ComboboxPositioner sideOffset={6}>
          <ComboboxPopup>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
            <ComboboxList>
              {(option: Option<T>) => (
                <ComboboxItem key={option.value} value={option}>
                  <ComboboxItemIndicator />
                  <div className="col-start-2">{option.label}</div>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
      {children}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
