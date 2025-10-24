import { startCase } from "lodash";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./ui/button";
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
  actions?: ButtonProps[];
  className?: string;
};

export function DetailsCard({
  title,
  description,
  details = [],
  actions = [],
  className,
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
            <p
              key={detail.key}
              className={cn("text-gray-700", detail.className)}
            >
              <strong>{startCase(detail.key)}:</strong> {detail.value}
            </p>
          ))}
        </div>
      </CardContent>
      {actions.length > 0 && (
        <CardFooter className="justify-center align-center sm:justify-end">
          <div className="flex flex-wrap justify-center gap-3">
            {actions.map((props, index) => (
              <Button key={index} {...props} />
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
