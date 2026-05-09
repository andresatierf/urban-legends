import { useStore } from "@tanstack/react-form";

import { useFieldContext } from "@/hooks/form-context";

import { Field, FieldError, FieldLabel } from "../../ui/field";
import { Textarea, type TextareaProps } from "../../ui/textarea";

export type TextareaFieldProps = TextareaProps & {
  label: string;
};

export function TextareaField({ label, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
