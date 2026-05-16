import { useStore } from "@tanstack/react-form";
import { useCallback } from "react";

import {
  ComposedCombobox,
  type ComboboxOption,
} from "@/components/ui/composed-combobox";
import { useFieldContext } from "@/hooks/form-context";

import { Field, FieldError, FieldLabel } from "../../ui/field";

export type ComboboxFieldProps<T extends string> = {
  label: string;
  options: ComboboxOption<T>[];
  onChange?: (value: T | "") => void;
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

  const handleChange = useCallback(
    (next: T | "") => {
      field.handleChange(next as T);
      onChange?.(next);
    },
    [field, onChange],
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <ComposedCombobox<T>
        id={field.name}
        name={field.name}
        options={options}
        placeholder={placeholder}
        value={field.state.value}
        onValueChange={handleChange}
        aria-invalid={isInvalid}
      />
      {children}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
