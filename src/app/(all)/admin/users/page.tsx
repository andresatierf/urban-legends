"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
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
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";

export default function UsersPage() {
  const users = useQuery(api.users.list);

  if (!users) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Users">
        {/* <Button href="/admin/users/new">Add New User</Button> */}
      </SectionHeader>

      <Card className="overflow-hidden">
        <Table className="w-full border-collapse text-left">
          {users && users?.length !== 0 && (
            <TableCaption className="my-0 bg-gray-50 py-2 text-gray-600">
              {users?.length} users
            </TableCaption>
          )}
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            <TableRow>
              <TableHead className="p-3">Name</TableHead>
              <TableHead className="p-3">Email</TableHead>
              <TableHead className="p-3">Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow
                key={user._id}
                className={cn("border-t transition hover:bg-gray-50")}
              >
                <TableCell className="p-3 font-medium text-gray-800">
                  {user.name}
                </TableCell>
                <Link href={`/admin/users/${user._id}` || ""}>
                  <TableCell className="p-3 text-gray-600">
                    {user.email}
                  </TableCell>
                </Link>
                <TableCell className="p-3 text-gray-600">
                  {user.roles?.join(", ")}
                </TableCell>
              </TableRow>
            ))}
            {(!users || users?.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="p-4 text-center text-gray-500 italic"
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
