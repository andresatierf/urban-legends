import { useStore } from "@tanstack/react-form";

import {
  ComposedSelect,
  type SelectOption,
} from "@/components/ui/composed-select";
import { useFieldContext } from "@/hooks/form-context";

import { Field, FieldError, FieldLabel } from "../../ui/field";

export type SelectFieldProps<T extends string> = {
  label: string;
  placeholder?: string;
  options: SelectOption<T>[];
};

export function SelectField<T extends string>({
  label,
  placeholder,
  options,
}: SelectFieldProps<T>) {
  const field = useFieldContext<T>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <ComposedSelect<T>
        id={field.name}
        name={field.name}
        options={options}
        placeholder={placeholder}
        value={field.state.value}
        onValueChange={(next) => field.handleChange(next as T)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
