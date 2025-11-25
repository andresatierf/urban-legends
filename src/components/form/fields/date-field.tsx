import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context";
import { localDateToUTC, utcToLocalDateInput } from "@/lib/dates";
import { Field, FieldError, FieldLabel } from "../../ui/field";
import { Input, type InputProps } from "../../ui/input";

export type DateFieldProps = InputProps & {
  label: string;
};

export function DateField({ label, ...props }: DateFieldProps) {
  const field = useFieldContext<string>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  // Convert UTC ISO to local date format for input display
  const localValue = field.state.value
    ? utcToLocalDateInput(field.state.value)
    : "";

  // Convert local date input to UTC ISO when changed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDate = e.target.value;
    if (localDate) {
      field.handleChange(localDateToUTC(localDate));
    } else {
      field.handleChange("");
    }
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        type="date"
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        value={localValue}
        onChange={handleChange}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
