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
