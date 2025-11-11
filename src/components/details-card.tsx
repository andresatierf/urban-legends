import { startCase } from "lodash";
import { type LucideIcon, MoreHorizontalIcon } from "lucide-react";
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
  actions?: {
    label: string;
    onClick: () => void;
    icon: LucideIcon;
    condition: boolean;
    separator?: "after" | "before";
    external?: boolean;
  }[];
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
              ?.filter((action) => action.external)
              .map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  onClick={action.onClick}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}

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
                  {actions?.map(
                    (action) =>
                      action.condition && (
                        <Fragment key={action.label}>
                          {action.separator === "before" && (
                            <DropdownMenuSeparator />
                          )}
                          <DropdownMenuItem onSelect={action.onClick}>
                            <action.icon className="h-4 w-4" />
                            {action.label}
                          </DropdownMenuItem>
                          {action.separator === "after" && (
                            <DropdownMenuSeparator />
                          )}
                        </Fragment>
                      ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ButtonGroup>
        </CardTitle>
        {description && (
          <CardDescription>
            {description || "No description available."}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {details.map((detail) => (
            <div key={detail.key} className="flex flex-col">
              <strong>{startCase(detail.key)}:</strong>
              <p className={cn("text-gray-700", detail.className)}>
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
