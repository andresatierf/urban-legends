import { Link } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { SvgIcon } from "@/components/svg-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminOverviewCardProps {
  stats: {
    users: {
      total: number;
      newThisWeek: number;
    };
    tournaments: {
      total: number;
      active: number;
      upcoming: number;
      ended: number;
    };
    teams: {
      total: number;
    };
    submissions: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
}

export function AdminOverviewCard({ stats }: AdminOverviewCardProps) {
  return (
    <Card variant="admin">
      <CardHeader className="flex flex-row gap-2 p-6 pb-0">
        <SvgIcon variant="purple" className="p-0">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </SvgIcon>
        <CardTitle className="font-semibold text-foreground text-xl">
          Admin Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 py-3">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            size="xs"
            className="p-4"
          />
          <StatCard
            title="Active Tournaments"
            value={stats.tournaments.active}
            size="xs"
            className="p-4"
          />
          <StatCard
            title="Total Teams"
            value={stats.teams.total}
            size="xs"
            className="p-4"
          />
          <StatCard
            title="Pending Reviews"
            value={stats.submissions.pending}
            size="xs"
            color="purple"
            className="p-4"
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start p-6 pt-0">
        <p className="pb-2 font-medium text-gray-700 text-sm">Admin Actions</p>
        <div className="flex flex-wrap gap-2">
          <CardAction>
            <Button variant="solid" color="purple" asChild>
              <Link to="/admin">Admin Dashboard</Link>
            </Button>
          </CardAction>
          <Button variant="outline" color="purple" asChild>
            <Link to="/tournaments">Manage Tournaments</Link>
          </Button>
          <Button variant="outline" color="purple" asChild>
            <Link to="/teams">Manage Teams</Link>
          </Button>
          <Button variant="outline" color="purple" asChild>
            <Link to="/users">Manage Users</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
