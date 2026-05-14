import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { SectionHeader } from "@/components/section-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { RolesBadgeList } from "@/components/users/roles-badge-list";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/users/")({
  component: UsersPage,
});

function UsersPage() {
  const users = useQuery(api.users.list, {});

  if (!users) {
    return (
      <>
        <SectionHeader as="h1" title="Users" />
        <TableSkeleton
          columns={3}
          headers={["Name", "Email", "Roles"]}
          rows={8}
        />
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Users" />

      <Card className="overflow-hidden">
        <Table className="w-full border-collapse text-left">
          {users && users?.length !== 0 && (
            <TableCaption className="text-label-caps text-muted-foreground my-0 py-2">
              {users?.length} users
            </TableCaption>
          )}
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <Link
                key={user._id}
                to="/users/$userId"
                params={{ userId: user._id }}
                className="contents"
              >
                <TableRow>
                  <TableCell className="font-medium">{user.name} </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RolesBadgeList roles={user.roleNames || []} />
                  </TableCell>
                </TableRow>
              </Link>
            ))}
            {(!users || users?.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground p-4 text-center italic"
                >
                  No users yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
