import { toast } from "sonner";

export function toastFormValues(value: unknown) {
  toast("You submitted the following values:", {
    description: (
      <pre className="bg-code text-code-foreground mt-2 w-full max-w-[320px] overflow-x-auto rounded-md p-4">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    ),
    position: "bottom-right",
    classNames: {
      content: "flex flex-col gap-2",
    },
    style: {
      "--border-radius": "calc(var(--radius)  + 4px)",
    } as React.CSSProperties,
  });
}
