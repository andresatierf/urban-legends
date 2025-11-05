import { ArrowRight } from "lucide-react";
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
          <Button
            variant="link"
            className="h-min p-0 font-normal text-blue-600 text-sm hover:text-blue-800"
            asChild
          >
            <Link href={link}>
              {linkText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
