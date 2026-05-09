import { useStore } from "@tanstack/react-form";
import { useCallback } from "react";

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
  onChange?: (value: T) => void;
  placeholder?: string;
  children?: React.ReactNode;
};

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

  const handleOnChange = useCallback(
    (value: T | null) => {
      if (value === null) return;
      field.handleChange(value);
      onChange?.(value);
    },
    [field, onChange],
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Combobox
        items={options.map((o) => o.value)}
        value={field.state.value}
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
              <ComboboxItem key={option.value} value={option.value}>
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
