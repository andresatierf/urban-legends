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

// TODO: figure this out
// export function toIdMap<T extends { _id: string }, K extends keyof T>(
//   array: T[],
// ) {
//   return array.reduce<Map<T[K], T>>(
//     (acc, curr) => acc.set(curr._id, curr),
//     new Map(),
//   );
// }
//
// export function toDictionary<TOriginal, TKey extends keyof TOriginal, TValue>(
//   array: Array<TOriginal>,
//   key: TKey,
// ): Record<TKey, TOriginal> {
//   return array.reduce<Record<TKey, TOriginal>>(
//     (acc, curr) => {
//       const keyValue = curr[key];
//       if (!acc[keyValue]) {
//         acc[keyValue] = curr;
//       }
//       return acc;
//     },
//     {} as Record<TKey, TOriginal>,
//   );
// }
//
// export function toDictionary<
//   TOriginal,
//   TKey extends string | number | symbol,
//   TValue,
// >(
//   array: Array<TOriginal>,
//   key: (x: TOriginal) => TKey,
//   value: (x: TOriginal) => TValue = (x) => x as unknown as TValue,
// ): Record<TKey, TValue> {
//   return array.reduce<Record<TKey, TValue>>(
//     (acc, curr) => {
//       const keyValue = key(curr);
//       if (!acc[keyValue]) {
//         acc[keyValue] = value(curr);
//       }
//       return acc;
//     },
//     {} as Record<TKey, TValue>,
//   );
// }
