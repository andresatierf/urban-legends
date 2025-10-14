export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="m-4">{children}</div>;
}
