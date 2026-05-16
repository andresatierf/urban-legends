import type { CSSProperties, ReactNode } from "react";

export type VariantMatrixProps<
  TVariant extends string,
  TColumn extends string,
> = {
  variants: readonly TVariant[];
  columns: readonly TColumn[];
  renderCell: (variant: TVariant, column: TColumn) => ReactNode;
  variantLabel?: (variant: TVariant) => string;
  columnLabel?: (column: TColumn) => string;
  /**
   * How cells should size their rendered children.
   * - `stretch` (default): children fill the cell — appropriate for cards.
   * - `content`: children render at intrinsic width and are centered — use
   *   for primitives like buttons or ribbons whose real-world width is
   *   driven by their content.
   */
  cellFit?: "stretch" | "content";
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
  cellFit = "stretch",
}: VariantMatrixProps<TVariant, TColumn>) {
  const cellClass =
    cellFit === "content"
      ? "flex h-full min-w-0 items-center justify-center px-2 py-2"
      : "flex h-full min-w-0 items-stretch justify-center px-2 py-2 [&>*]:w-full";
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `auto repeat(${columns.length}, minmax(0, 1fr))`,
    gridTemplateRows: "auto",
    gridAutoRows: "1fr",
  };

  return (
    <div className="overflow-x-auto">
      <div
        role="table"
        className="grid min-w-full items-stretch gap-x-3 gap-y-4"
        style={gridStyle}
      >
        <div
          role="columnheader"
          className="text-label-caps text-muted-foreground bg-paper-deep px-4 py-2 text-left"
        >
          Variant
        </div>
        {columns.map((col) => (
          <div
            key={col}
            role="columnheader"
            className="text-label-caps text-muted-foreground bg-paper-deep px-4 py-2 text-center"
          >
            {columnLabel(col)}
          </div>
        ))}

        {variants.map((variant) => (
          <div
            key={variant}
            role="row"
            className="border-foreground/10 contents"
          >
            <div
              role="rowheader"
              className="text-body-sm flex items-center px-4 py-4 font-medium"
            >
              {variantLabel(variant)}
            </div>
            {columns.map((col) => (
              <div key={col} role="cell" className={cellClass}>
                {renderCell(variant, col)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
