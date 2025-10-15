"use client";

import { StatCard } from "@/components/tournaments/stat-card";
import { Button } from "@/components/ui/button";
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
import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo } from "react";
import { api } from "../../../../convex/_generated/api";

export default function TournamentsPage() {
  const tournaments = useQuery(api.tournaments.list) || [];
  const now = new Date();
  const isoNow = now.toISOString();
  const total = tournaments.length;

  const active = useMemo(
    () =>
      tournaments.filter(
        (t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now,
      ).length,
    [now, tournaments],
  );

  const upcoming = useMemo(
    () => tournaments.filter((t) => new Date(t.startDate) > now).length,
    [now, tournaments],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-semibold text-2xl text-gray-800">Tournaments</h1>
        <Link href="/admin/tournaments/new">
          <Button>Add New Tournament</Button>
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Active Tournaments"
          value={active}
          color="text-green-600"
        />
        <StatCard
          title="Upcoming Tournaments"
          value={upcoming}
          color="text-yellow-500"
        />
        <StatCard
          title="Total Tournaments"
          value={total}
          color="text-blue-500"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table className="w-full border-collapse text-left">
          {tournaments && tournaments?.length === 0 && (
            <TableCaption>{tournaments?.length} tournaments</TableCaption>
          )}
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            <TableRow>
              <TableHead className="p-3">Name</TableHead>
              <TableHead className="p-3">Start Date</TableHead>
              <TableHead className="p-3">End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments?.map((t) => (
              <TableRow
                key={t._id}
                className={cn("border-t transition hover:bg-gray-50", {
                  "bg-green-50": t.startDate <= isoNow && t.endDate >= isoNow,
                  "bg-yellow-50": t.startDate > isoNow,
                  "bg-red-50": t.endDate < isoNow,
                })}
              >
                <TableCell className="p-3 font-medium text-gray-800">
                  <Link href={`/admin/tournaments/${t._id}` || ""}>
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell className="p-3 text-gray-600">
                  {t.startDate}
                </TableCell>
                <TableCell className="p-3 text-gray-600">{t.endDate}</TableCell>
              </TableRow>
            ))}
            {(!tournaments || tournaments?.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No tournaments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
