import { Toaster } from "sonner";

import { useTheme } from "@/hooks/use-theme";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !text-foreground !border-2 !border-border !shadow-shadow !rounded-lg",
          title: "!text-foreground",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
          success:
            "!bg-badge-success-bg !text-badge-success-text !border-badge-success-border",
          error:
            "!bg-badge-error-bg !text-badge-error-text !border-badge-error-border",
          info: "!bg-badge-info-bg !text-badge-info-text !border-badge-info-border",
        },
      }}
    />
  );
}
