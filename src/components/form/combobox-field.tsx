import { useCallback } from "react";
import { Combobox } from "../ui/combobox";
import { Field, FieldError, FieldLabel } from "../ui/field";

type Props<T> = {
  field: any;
  label: string;
  options: { value: T; label: string }[];
  onChange?: (value: T) => void;
  placeholder?: string;
  children?: React.ReactNode;
};

export function ComboboxField<T>({
  field,
  label,
  options,
  onChange,
  placeholder,
  children,
}: Props<T>) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const handleOnChange = useCallback(
    (value: T) => {
      field.handleChange(value);
      onChange?.(value);
    },
    [field, onChange],
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel html-for={field.name}>{label}</FieldLabel>
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
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
