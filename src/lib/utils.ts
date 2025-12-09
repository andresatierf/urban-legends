import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function tryMutate<T>({
  fn,
  onSuccess,
  onFailure,
  onFinally,
  successToast: successMessage,
  defaultFailureToast: failureMessage,
}: {
  fn: () => Promise<T>;
  onSuccess?: (ret: T) => void;
  onFailure?: (error: unknown) => void;
  onFinally?: () => void;
  successToast?: string;
  defaultFailureToast?: string;
}) {
  try {
    const ret = await fn();
    toast(successMessage || "Success");
    onSuccess?.(ret);
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : failureMessage || "Failure",
    );
    onFailure?.(error);
  } finally {
    onFinally?.();
  }
}
