import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { redirect } from "next/navigation";
import * as z from "zod";
import { toastFormValues } from "@/lib/form";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const formSchema = z.object({
  name: z.string().min(1, "Name can't be empty"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function CreateUserForm() {
  const createUser = useMutation(api.users.create);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      toastFormValues(value);
      await createUser(value);
      redirect("/admin/users");
    },
  });

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: <explanation>
    <form
      id="create-user-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="User's name"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="user@example.com"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  type="password"
                  placeholder="********"
                  autoComplete="new-password"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <Field orientation="horizontal" className="mt-8 flex justify-end">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="create-user-form">
          Submit
        </Button>
      </Field>
    </form>
  );
}