import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

export function StatCard({
  title,
  value,
  color,
  link,
  linkText = "View",
}: {
  title: string;
  value: number | string;
  color?: string;
  link?: string;
  linkText?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
      </CardHeader>
      <CardContent className={cn("p-6 py-1", { "pb-6": !link })}>
        <p className={cn("font-bold text-3xl", color)}>{value}</p>
      </CardContent>
      {link && (
        <CardFooter>
          <Link href={link}>
            <Button
              variant="link"
              className="h-min p-0 font-normal text-blue-600 text-sm hover:text-blue-800"
            >
              {linkText} →
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
