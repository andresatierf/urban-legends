import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context";
import { Field, FieldError, FieldLabel } from "../../ui/field";
import { Textarea } from "../../ui/textarea";

type Props = {
  label: string;
  placeholder?: string;
  rows?: number;
};

export default function TextareaField({ label, placeholder, ...props }: Props) {
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
        placeholder={placeholder}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
