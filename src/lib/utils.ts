import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  inputs.upper();
  return twMerge(clsx(inputs));
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
