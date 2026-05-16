import { useStore } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";

import { useFieldContext } from "@/hooks/form-context";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
      >
        <ComboboxInput
          id={field.name}
          name={field.name}
          placeholder={placeholder}
          aria-invalid={isInvalid}
        />
        <ComboboxContent>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {children}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
