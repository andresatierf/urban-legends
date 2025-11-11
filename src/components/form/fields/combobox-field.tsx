import { useStore } from "@tanstack/react-form";
import { useCallback } from "react";
import { useFieldContext } from "@/hooks/form-context";
import { Combobox } from "../../ui/combobox";
import { Field, FieldError, FieldLabel } from "../../ui/field";

type Props<T> = {
  label: string;
  options: { value: T; label: string }[];
  onChange?: (value: T) => void;
  placeholder?: string;
  children?: React.ReactNode;
};

export default function ComboboxField<T extends string>({
  label,
  options,
  onChange,
  placeholder,
  children,
}: Props<T>) {
  const field = useFieldContext<T>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  const handleOnChange = useCallback(
    (value: T) => {
      field.handleChange(value);
      onChange?.(value);
    },
    [field, onChange],
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Combobox
        id={field.name}
        name={field.name}
        value={field.state.value}
        setValue={handleOnChange}
        options={options}
        noSelectionText={placeholder}
        aria-invalid={isInvalid}
      />
      {children}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
