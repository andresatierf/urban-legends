import { startCase } from "lodash";
import { type LucideIcon, MoreHorizontalIcon } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type Props = {
  title: string;
  description?: string;
  details?: { key: string; value: React.ReactNode; className?: string }[];
  actions?: ({
    label: string;
    icon: LucideIcon;
    condition: boolean;
    separator?: "after" | "before";
    external?: boolean;
  } & ({ href: LinkProps["href"] } | { onClick: () => void }))[];
  className?: string;
};

export function DetailsCard({
  title,
  description,
  details = [],
  actions,
  className,
}: Props) {
  return (
    <Card className={cn("min-w-fit", className)}>
      <CardHeader>
        <CardTitle className="flex justify-between text-xl">
          {title}
          <ButtonGroup>
            {actions
              ?.filter((action) => action.external && action.condition)
              .map((action) => {
                if ("href" in action)
                  return (
                    <Button key={action.label} variant="outline" asChild>
                      <Link href={action.href}>
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </Link>
                    </Button>
                  );

                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    onClick={action.onClick}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}

            {actions?.some((action) => action.condition) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More Options"
                  >
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {actions
                    .filter((action) => action.condition)
                    .map((action, index) => {
                      return (
                        <Fragment key={action.label}>
                          {action.separator === "before" && index !== 0 && (
                            <DropdownMenuSeparator />
                          )}
                          {"href" in action ? (
                            <DropdownMenuItem asChild>
                              <Link href={action.href}>
                                <action.icon className="h-4 w-4" />
                                {action.label}
                              </Link>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={action.onClick}>
                              <action.icon className="h-4 w-4" />
                              {action.label}
                            </DropdownMenuItem>
                          )}
                          {action.separator === "after" && (
                            <DropdownMenuSeparator />
                          )}
                        </Fragment>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ButtonGroup>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {details.map((detail) => (
            <div key={detail.key} className="flex flex-col">
              <strong>{startCase(detail.key)}:</strong>
              <span className={cn("text-muted-foreground", detail.className)}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
