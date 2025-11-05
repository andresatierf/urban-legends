import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type Props = {
  field: any;
  label: string;
};

export function DateField({ field, label }: Props) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel html-for={field.name}>{label}</FieldLabel>
      <Input
        type="date"
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
