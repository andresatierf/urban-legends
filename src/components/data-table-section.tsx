import { SectionHeader } from "./section-header";
import { DataTable, type DataTableProps } from "./ui/data-table/data-table";

export type DataTableSectionProps<TData, TValue> = DataTableProps<
  TData,
  TValue
> & {
  as?: keyof React.JSX.IntrinsicElements;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function DataTableSection<T extends { _id: string }, V>({
  as,
  title,
  description,
  actions,
  ...props
}: DataTableSectionProps<T, V>) {
  return (
    <>
      <SectionHeader as={as} title={title} description={description}>
        {actions}
      </SectionHeader>
      <DataTable {...props} />
    </>
  );
}
