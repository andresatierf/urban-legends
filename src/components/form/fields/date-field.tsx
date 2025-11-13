import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context";
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

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        type="date"
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
