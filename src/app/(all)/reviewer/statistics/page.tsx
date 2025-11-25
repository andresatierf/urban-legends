"use client";

import { useQuery } from "convex/react";
import { CheckCircle, Loader2, TrendingUp, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";

export default function ReviewStatistics() {
  const { user } = useUser();

  // Permission check
  if (
    user &&
    !user.roleNames.includes("reviewer") &&
    !user.roleNames.includes("admin")
  ) {
    redirect("/dashboard");
  }

  // Query
  const statistics = useQuery(api.reviewer.getStatistics);

  // Loading state
  if (!statistics) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          <h1 className="font-bold text-3xl">Review Statistics</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const { totalReviews, approved, rejected, approvalRate, recentReviews } =
    statistics;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <TrendingUp className="h-8 w-8" />
        <div>
          <h1 className="font-bold text-3xl">Review Statistics</h1>
          <p className="text-muted-foreground text-sm">
            Your performance metrics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalReviews}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{approved}</div>
            <p className="text-muted-foreground text-xs">
              {totalReviews > 0
                ? `${Math.round((approved / totalReviews) * 100)}% of total`
                : "No reviews yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{rejected}</div>
            <p className="text-muted-foreground text-xs">
              {totalReviews > 0
                ? `${Math.round((rejected / totalReviews) * 100)}% of total`
                : "No reviews yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{approvalRate}%</div>
            <p className="text-muted-foreground text-xs">
              Based on {totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Your last 20 review actions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentReviews.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No recent reviews</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {review.state === "approved" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {review.team?.name || "Unknown Team"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {review.tournament?.name || "Unknown Tournament"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                        review.type === "individual"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {review.type === "individual"
                        ? "Individual"
                        : "Team Activity"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                        review.state === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {review.state === "approved" ? "Approved" : "Rejected"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {review.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
