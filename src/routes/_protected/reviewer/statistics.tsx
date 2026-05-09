import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { CheckCircle, Loader2, TrendingUp, XCircle } from "lucide-react";
import { useEffect } from "react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/reviewer/statistics")({
  component: ReviewStatistics,
});

function ReviewStatistics() {
  const { user, isAdmin, isReviewer, isTournamentManager } = useUser();
  const { format } = useFormattedDate();
  const navigate = useNavigate();

  // Permission check (client-side navigation)
  useEffect(() => {
    if (user && !isAdmin && !isReviewer && !isTournamentManager) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, isAdmin, isReviewer, isTournamentManager, navigate]);

  // Query
  const statistics = useQuery(api.role.reviewer.getStatistics);

  // Loading state
  if (!statistics) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Review Statistics</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const { totalReviews, approved, rejected, approvalRate, recentReviews } =
    statistics;

  return (
    <>
      <SectionHeader
        as="h1"
        title="Review Statistics"
        description="Your performance metrics"
        Icon={TrendingUp}
      />

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approved}</div>
            <p className="text-muted-foreground text-xs">
              {totalReviews > 0
                ? `${Math.round((approved / totalReviews) * 100)}% of total`
                : "No reviews yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejected}</div>
            <p className="text-muted-foreground text-xs">
              {totalReviews > 0
                ? `${Math.round((rejected / totalReviews) * 100)}% of total`
                : "No reviews yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate}%</div>
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
                      <p className="text-sm font-medium">
                        {review.team?.name || "Unknown Team"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {review.tournament?.name || "Unknown Tournament"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn({
                        "bg-blue-100 text-blue-800 hover:bg-blue-100":
                          review.type === "individual",
                        "bg-green-100 text-green-800 hover:bg-green-100":
                          review.type !== "individual",
                      })}
                    >
                      {review.type === "individual"
                        ? "Individual"
                        : "Team Activity"}
                    </Badge>
                    <Badge
                      className={cn({
                        "bg-green-100 text-green-800 hover:bg-green-100":
                          review.state === "approved",
                        "bg-red-100 text-red-800 hover:bg-red-100":
                          review.state !== "approved",
                      })}
                    >
                      {review.state === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {format(review.date, "short")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
