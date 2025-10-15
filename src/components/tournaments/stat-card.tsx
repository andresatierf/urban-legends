import { Card, CardContent, CardHeader } from "../ui/card";

export function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="pt-4 pb-1">
        <p className="text-gray-500 text-sm">{title}</p>
      </CardHeader>
      <CardContent className="pb-3">
        <p className={`mt-2 font-bold text-3xl ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
