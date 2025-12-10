/**
 * Utility type for extracting the type of a nested property using dot notation.
 *
 * @template T - The object type to traverse
 * @template P - The property path as a string (e.g., "user.profile.name")
 *
 * @example
 * type User = { profile: { name: string } };
 * type Name = DeepValue<User, "profile.name">; // string
 */
type DeepValue<T, P> = P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? DeepValue<T[K], R>
    : undefined
  : P extends keyof T
    ? T[P]
    : undefined;

/**
 * Converts an array of objects to a Map using a specified key property.
 * Supports nested keys using dot notation (e.g., "user.id").
 *
 * @template TItem - The type of items in the array
 * @template TMapKey - The key path to use for Map keys (supports dot notation)
 * @template TMapValue - Optional property to use for Map values (defaults to entire item)
 *
 * @param items - The array of objects to convert
 * @param mapKey - The property path to use as Map keys (e.g., "id" or "user.id")
 * @param mapValue - Optional property to use as Map values (if omitted, uses entire item)
 *
 * @returns A Map where keys are extracted from the specified property path
 *
 * @example
 * const users = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
 * const userMap = toMap(users, "id"); // Map<number, User>
 * const nameMap = toMap(users, "id", "name"); // Map<number, string>
 *
 * @example
 * // Nested key example
 * const items = [{ user: { id: "a1" }, data: "foo" }];
 * const map = toMap(items, "user.id"); // Map<string, Item>
 */
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
