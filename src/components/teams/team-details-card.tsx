import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type Props = {
  team: any;
  className?: string;
};

export function TeamDetailsCard({ team, className }: Props) {
  if (!team) return null; // TODO: Add skeleton

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">{team?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          <div className="flex flex-col gap-2">
            <p className="text-gray-600 text-sm">
              <strong>Tournament:</strong> {team?.tournament?.name || "unknown"}
            </p>
            <p className="text-gray-600 text-sm">
              <strong>Score:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {team?.score || 0} pts
              </span>
            </p>
          </div>
        </CardDescription>
      </CardContent>
    </Card>
  );
}
