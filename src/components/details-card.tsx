import { startCase } from "lodash";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

type Props = {
  title: string;
  description?: string;
  details?: { key: string; value: string; className?: string }[];
  className?: string;
  children?: React.ReactNode;
};

export function DetailsCard({
  title,
  description,
  details = [],
  className,
  children,
}: Props) {
  return (
    <Card className={cn("min-w-fit", className)}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && (
          <CardDescription>
            {description || "No description available."}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {details.map((detail) => (
            <div key={detail.key} className="flex gap-2">
              <strong>{startCase(detail.key)}:</strong>
              <p className={cn("text-gray-700", detail.className)}>
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
      {children && (
        <CardFooter className="justify-center align-center sm:justify-end">
          <div className="flex flex-wrap justify-center gap-3">{children}</div>
        </CardFooter>
      )}
    </Card>
  );
}
