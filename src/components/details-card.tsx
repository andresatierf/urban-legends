import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button, type ButtonProps } from "./ui/button";
import { startCase } from "lodash";
import Link from "next/link";

export type DetailsCardAction = {
  text: string;
  variant?: ButtonProps["variant"];
  linkProps?: React.ComponentProps<typeof Link>;
  buttonProps?: ButtonProps;
};

type Props = {
  title: string;
  description?: string;
  details?: { key: string; value: string; className?: string }[];
  actions?: DetailsCardAction[];
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
      {actions && (
        <CardFooter className="justify-center align-center sm:justify-end">
          <div className="flex flex-wrap justify-center gap-3">
            {actions.map(({ text, linkProps, buttonProps }) =>
              linkProps ? (
                <Link key={text} {...linkProps}>
                  <Button {...buttonProps}>{text}</Button>
                </Link>
              ) : (
                <Button key={text} {...buttonProps}>
                  {text}
                </Button>
              ),
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
