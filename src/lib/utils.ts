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

type DeepValue<T, P> = P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? DeepValue<T[K], R>
    : undefined
  : P extends keyof T
    ? T[P]
    : undefined;

export function toMap<
  TItem extends object,
  TMapKey extends string,
  TMapValue extends keyof TItem | undefined = undefined,
>(
  items: Array<TItem>,
  mapKey: TMapKey,
  mapValue?: TMapValue,
): Map<
  NonNullable<DeepValue<TItem, TMapKey>>,
  TMapValue extends keyof TItem ? TItem[TMapValue] : TItem
> {
  return new Map(
    items.map((item) => {
      const k = (mapKey as string)
        .split(".")
        .reduce(
          (acc: any, path: string) => (acc ? acc[path] : undefined),
          item,
        );

      // Explicitly type `v` to match the expected return type based on TMapValue
      const v: TMapValue extends keyof TItem ? TItem[TMapValue] : TItem =
        mapValue !== undefined ? (item[mapValue] as any) : (item as any); // Use 'as any' as a temporary bridge for inference

      return [k, v];
    }),
  );
}
