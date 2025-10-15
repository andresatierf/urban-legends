export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="font-semibold text-2xl text-gray-800">{title}</h1>
      {children}
    </div>
  );
}
