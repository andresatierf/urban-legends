import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

type Props = {
  tournament: any;
  className?: string;
};

export function TournamentDetailsCard({ tournament, className }: Props) {
  if (!tournament) return null; // TODO: Add skeleton

  return (
    <Card className={cn("min-w-fit", className)}>
      <CardHeader>
        <CardTitle className="text-xl">{tournament?.name}</CardTitle>
        <CardDescription>
          {tournament?.description || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="text-gray-700">
            <strong>Start Date:</strong> {tournament?.startDate}
          </p>
          <p className="text-gray-700">
            <strong>End Date:</strong> {tournament?.endDate}
          </p>
          <p className="text-gray-700">
            <strong>Participants:</strong>{" "}
            {tournament?.users?.length
              ? tournament?.users?.join(", ")
              : "No users assigned"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-center align-center sm:justify-end">
        <div className="flex flex-wrap justify-center gap-3">
          <Button>Edit Tournament</Button>
          <Button variant="secondary">Manage Teams</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
