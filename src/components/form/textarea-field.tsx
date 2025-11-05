import { Field, FieldError, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

type Props = {
  field: any;
  label: string;
  placeholder?: string;
};

export function TextareaField({ field, label, placeholder }: Props) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel html-for={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
