import { startCase } from "lodash";
import { MoreHorizontalIcon } from "lucide-react";
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
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
        <CardTitle className="flex justify-between text-xl">
          {title}
          <ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More Options">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {children}
              </DropdownMenuContent>
            </DropdownMenu>
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
