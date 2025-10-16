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
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">{tournament?.name}</CardTitle>
        <CardDescription>
          {tournament?.description || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-fit grid-cols-1 gap-4 sm:grid-cols-3">
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
      <CardFooter>
        <div className="flex gap-3">
          <Button>Edit Tournament</Button>
          <Button variant="secondary">Manage Teams</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
