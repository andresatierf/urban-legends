import type { ReactNode } from "react";

export type VariantMatrixProps<
  TVariant extends string,
  TColumn extends string,
> = {
  variants: readonly TVariant[];
  columns: readonly TColumn[];
  renderCell: (variant: TVariant, column: TColumn) => ReactNode;
  variantLabel?: (variant: TVariant) => string;
  columnLabel?: (column: TColumn) => string;
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function VariantMatrix<TVariant extends string, TColumn extends string>({
  variants,
  columns,
  renderCell,
  variantLabel = capitalize,
  columnLabel = capitalize,
}: VariantMatrixProps<TVariant, TColumn>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-label-caps text-muted-foreground bg-paper-deep px-4 py-2 text-left">
              Variant
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="text-label-caps text-muted-foreground bg-paper-deep px-4 py-2 text-center"
              >
                {columnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant} className="border-foreground/10 border-b">
              <td className="text-body-sm px-4 py-4 font-medium">
                {variantLabel(variant)}
              </td>
              {columns.map((col) => (
                <td key={col} className="px-4 py-4 text-center">
                  {renderCell(variant, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
