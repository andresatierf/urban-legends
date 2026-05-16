import type { ReactNode } from "react";

import { useAppForm } from "@/hooks/form";

export function DemoFormShell({ children }: { children: ReactNode }) {
  const form = useAppForm({
    defaultValues: {} as Record<string, unknown>,
    onSubmit: ({ value }) => {
      console.info("[DemoFormShell] submit", value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppForm>{children}</form.AppForm>
    </form>
  );
}
