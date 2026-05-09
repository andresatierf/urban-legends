# Reviewer Dashboard

**Priority:** HIGH
**Status:** Not Implemented
**Estimated Effort:** 2-3 days

## Problem Statement

The `reviewer` role exists in the system but has no dedicated interface. Reviewers are specialized users who focus solely on reviewing and moderating submissions, without the full administrative powers of admins or tournament managers. They need their own dashboard to:

- View and process pending submissions efficiently
- Review submission content and evidence
- Approve or reject submissions with detailed reasons
- Track their review activity and performance
- Handle flagged or disputed submissions
- Maintain quality standards across all tournaments

Currently, reviewers have no way to execute their role-specific functions, forcing organizations to give full admin access to users who should only have review capabilities.

## Current State

### What Exists

- `reviewer` role defined in roles system (hierarchy: 3)
- Role description: "Can review/approve/reject submissions, moderate content, handle disputes"
- Permission checks in backend (`user.roles.includes("admin")`)
- General submissions listing page (`/submissions`)
- Admin submission approval/rejection functionality

### What's Missing

- No `/reviewer` dashboard
- No dedicated review queue interface
- No reviewer-specific submission filters
- No review statistics and performance tracking
- No dispute resolution workflow
- No quality control metrics
- Permission checks don't include "reviewer" role

### Evidence

- `convex/roles.ts` defines reviewer role (line 18-22)
- No route exists for reviewer dashboard
- Submission approval/rejection requires admin role (should allow reviewer)
- No reviewer-specific features in submission components

## Requirements

### Functional Requirements

1. **Review Queue Dashboard**
   - View all pending submissions across all tournaments
   - Prioritized queue (oldest first, or by tournament urgency)
   - Quick stats: pending count, reviewed today, approval rate
   - Filter by tournament, team, date range, tier
   - Search submissions by content or submitter

2. **Submission Review Interface**
   - View submission details: date, description, activity
   - View submission evidence (images, links, notes)
   - See submitter and team information
   - View submission history (previous submissions by same team)
   - Quick approve/reject actions
   - Require reason/notes for rejection
   - Optional notes for approval (positive feedback)

3. **Bulk Review Actions**
   - Select multiple submissions
   - Bulk approve (with confirmation)
   - Bulk reject (must provide reason)
   - Filter and bulk actions combined

4. **Review History & Statistics**
   - Personal review statistics: total reviewed, approval rate, avg time per review
   - Recent review activity feed
   - Reviews per day/week/month chart
   - Comparison to other reviewers (optional, for gamification)
   - Export review history (CSV)

5. **Dispute Resolution**
   - Flag submissions for dispute (by teams or other reviewers)
   - View flagged submissions queue
   - Add resolution notes
   - Escalate to admin if needed
   - Track dispute resolution time

6. **Quality Control**
   - View rejected submissions to ensure consistency
   - Comment on other reviewers' decisions (internal notes)
   - Quality metrics: consistency score, response time
   - Review guidelines and standards reference

### Non-Functional Requirements

- Review queue loads in <1 second
- Real-time updates when new submissions arrive
- Support reviewing up to 1000 submissions/day
- Keyboard shortcuts for efficient review
- Mobile-responsive for on-the-go reviews
- Audit logging for all review actions

## Database Schema Changes

### Modified Tables

```typescript
// Add reviewer tracking to submissions (optional, for audit)
submissions: defineTable({
  // ... existing fields
  reviewedBy: v.optional(v.id("users")), // Who approved/rejected
  reviewedAt: v.optional(v.string()), // When reviewed
  reviewNotes: v.optional(v.string()), // Reviewer notes (for rejections or positive feedback)
});
```

### New Tables

```typescript
// Track disputes and escalations
submissionDisputes: defineTable({
  submissionId: v.id("submissions"),
  flaggedBy: v.id("users"), // User who flagged
  flaggedByRole: v.string(), // "reviewer", "team_member", "admin"
  reason: v.string(),
  status: v.union(
    v.literal("open"),
    v.literal("investigating"),
    v.literal("resolved"),
    v.literal("escalated")
  ),
  assignedTo: v.optional(v.id("users")), // Reviewer assigned to dispute
  resolution: v.optional(v.string()),
  resolvedBy: v.optional(v.id("users")),
  resolvedAt: v.optional(v.string()),
  createdAt: v.string(),
})
  .index("by_submission", ["submissionId"])
  .index("by_status", ["status"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_flagged_by", ["flaggedBy"]),

// Internal notes between reviewers (optional)
reviewerNotes: defineTable({
  submissionId: v.id("submissions"),
  reviewerId: v.id("users"),
  note: v.string(),
  noteType: v.union(
    v.literal("question"),
    v.literal("concern"),
    v.literal("info")
  ),
  createdAt: v.string(),
})
  .index("by_submission", ["submissionId"])
  .index("by_reviewer", ["reviewerId"]),
```

## Backend Implementation

### Modified Mutations

#### `submissions.approve` (update existing)

```typescript
export const approve = mutation({
  args: {
    submissionId: v.id("submissions"),
    notes: v.optional(v.string()), // Optional positive feedback
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow admin, tournament_manager, or reviewer
    const hasPermission =
      user.roles.includes("admin") ||
      user.roles.includes("tournament_manager") ||
      user.roles.includes("reviewer");

    if (!hasPermission) {
      throw new Error("Admin, Tournament Manager, or Reviewer access required");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // If tournament manager, verify they manage this tournament
    if (
      user.roles.includes("tournament_manager") &&
      !user.roles.includes("admin")
    ) {
      const team = await ctx.db.get(submission.teamId);
      if (!team) throw new Error("Team not found");

      const assignment = await ctx.db
        .query("tournamentManagers")
        .withIndex("by_tournament_and_manager", (q) =>
          q.eq("tournamentId", team.tournamentId).eq("managerId", user._id),
        )
        .first();

      if (!assignment) {
        throw new Error("You are not assigned to manage this tournament");
      }
    }

    // Calculate points and update
    const team = await ctx.db.get(submission.teamId);
    if (!team) throw new Error("Team not found");

    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    // Calculate points based on tier and participation
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();

    const submissionDate = submission.date;
    const teammates = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .filter((q) => q.eq(q.field("date"), submissionDate))
      .collect();

    const participationRate = teammates.length / teamMembers.length;
    const isTeamExercise =
      participationRate >= tournament.scoringConfig.teamExerciseThreshold;

    const pointsConfig = isTeamExercise
      ? tournament.scoringConfig.teamExercisePoints
      : tournament.scoringConfig.individualPoints;

    const pointsEarned = pointsConfig[submission.tier];

    // Update submission
    await ctx.db.patch(args.submissionId, {
      state: "approved",
      pointsEarned,
      reviewedBy: user._id,
      reviewedAt: new Date().toISOString(),
      reviewNotes: args.notes,
    });

    // Update team points
    await ctx.db.patch(team._id, {
      points: (team.points || 0) + pointsEarned,
      lastActivityAt: new Date().toISOString(),
    });

    return { success: true, pointsEarned };
  },
});
```

#### `submissions.reject` (update existing)

```typescript
export const reject = mutation({
  args: {
    submissionId: v.id("submissions"),
    reason: v.string(), // Required for rejection
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasPermission =
      user.roles.includes("admin") ||
      user.roles.includes("tournament_manager") ||
      user.roles.includes("reviewer");

    if (!hasPermission) {
      throw new Error("Reviewer, Tournament Manager, or Admin access required");
    }

    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error("Rejection reason is required");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Permission checks for tournament managers
    if (
      user.roles.includes("tournament_manager") &&
      !user.roles.includes("admin")
    ) {
      const team = await ctx.db.get(submission.teamId);
      if (!team) throw new Error("Team not found");

      const assignment = await ctx.db
        .query("tournamentManagers")
        .withIndex("by_tournament_and_manager", (q) =>
          q.eq("tournamentId", team.tournamentId).eq("managerId", user._id),
        )
        .first();

      if (!assignment) {
        throw new Error("You are not assigned to manage this tournament");
      }
    }

    // If previously approved, deduct points
    let pointsDeducted = 0;
    if (submission.state === "approved" && submission.pointsEarned) {
      const team = await ctx.db.get(submission.teamId);
      if (team) {
        pointsDeducted = submission.pointsEarned;
        await ctx.db.patch(team._id, {
          points: Math.max(0, (team.points || 0) - pointsDeducted),
          lastActivityAt: new Date().toISOString(),
        });
      }
    }

    // Update submission
    await ctx.db.patch(args.submissionId, {
      state: "rejected",
      reviewedBy: user._id,
      reviewedAt: new Date().toISOString(),
      reviewNotes: args.reason,
    });

    return { success: true, pointsDeducted };
  },
});
```

### New Mutations

#### `submissionDisputes.create`

```typescript
export const create = mutation({
  args: {
    submissionId: v.id("submissions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Any authenticated user can flag a submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check if already disputed
    const existing = await ctx.db
      .query("submissionDisputes")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .filter((q) => q.neq(q.field("status"), "resolved"))
      .first();

    if (existing) {
      throw new Error("Submission already has an open dispute");
    }

    // Determine role of flagging user
    let flaggedByRole = "team_member";
    if (user.roles.includes("admin")) flaggedByRole = "admin";
    else if (user.roles.includes("reviewer")) flaggedByRole = "reviewer";
    else if (user.roles.includes("tournament_manager"))
      flaggedByRole = "tournament_manager";

    await ctx.db.insert("submissionDisputes", {
      submissionId: args.submissionId,
      flaggedBy: user._id,
      flaggedByRole,
      reason: args.reason,
      status: "open",
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
```

#### `submissionDisputes.resolve`

```typescript
export const resolve = mutation({
  args: {
    disputeId: v.id("submissionDisputes"),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasPermission =
      user.roles.includes("admin") ||
      user.roles.includes("reviewer") ||
      user.roles.includes("tournament_manager");

    if (!hasPermission) {
      throw new Error("Reviewer, Tournament Manager, or Admin access required");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolution: args.resolution,
      resolvedBy: user._id,
      resolvedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
```

#### `submissionDisputes.escalate`

```typescript
export const escalate = mutation({
  args: {
    disputeId: v.id("submissionDisputes"),
    escalationNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("reviewer") && !user.roles.includes("admin")) {
      throw new Error("Reviewer or Admin access required");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    await ctx.db.patch(args.disputeId, {
      status: "escalated",
      resolution: args.escalationNotes,
    });

    // Optionally: Send notification to admins

    return { success: true };
  },
});
```

### New Queries

#### `reviewer.getReviewQueue`

```typescript
export const getReviewQueue = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
    state: v.optional(v.union(v.literal("pending"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasPermission =
      user.roles.includes("admin") ||
      user.roles.includes("reviewer") ||
      user.roles.includes("tournament_manager");

    if (!hasPermission) {
      throw new Error("Reviewer, Tournament Manager, or Admin access required");
    }

    const state = args.state || "pending";
    const limit = args.limit || 100;

    // Build query
    let query = ctx.db.query("submissions");

    if (state === "pending") {
      query = query.withIndex("by_state", (q) => q.eq("state", "pending"));
    }

    const submissions = await query.order("asc").take(limit);

    // Filter by tournament if specified
    const filteredSubmissions = args.tournamentId
      ? await Promise.all(
          submissions.map(async (sub) => {
            const team = await ctx.db.get(sub.teamId);
            return team?.tournamentId === args.tournamentId ? sub : null;
          }),
        ).then((results) => results.filter((s) => s !== null))
      : submissions;

    // Enrich with team and user data
    const enriched = await Promise.all(
      filteredSubmissions.map(async (sub) => {
        const team = await ctx.db.get(sub.teamId);
        const tournament = team ? await ctx.db.get(team.tournamentId) : null;
        const submitter = await ctx.db.get(sub.userId);
        const reviewer = sub.reviewedBy
          ? await ctx.db.get(sub.reviewedBy)
          : null;

        return {
          ...sub,
          team: team
            ? {
                id: team._id,
                name: team.name,
                tournamentId: team.tournamentId,
              }
            : null,
          tournament: tournament
            ? {
                id: tournament._id,
                name: tournament.name,
              }
            : null,
          submitter: submitter
            ? {
                id: submitter._id,
                name: submitter.name,
              }
            : null,
          reviewer: reviewer
            ? {
                id: reviewer._id,
                name: reviewer.name,
              }
            : null,
        };
      }),
    );

    return enriched;
  },
});
```

#### `reviewer.getStatistics`

```typescript
export const getStatistics = query({
  args: {
    reviewerId: v.optional(v.id("users")), // Optional: get stats for specific reviewer
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasPermission =
      user.roles.includes("admin") || user.roles.includes("reviewer");

    if (!hasPermission) {
      throw new Error("Reviewer or Admin access required");
    }

    // If not admin, can only view own stats
    const targetReviewerId =
      args.reviewerId && user.roles.includes("admin")
        ? args.reviewerId
        : user._id;

    // Get all submissions reviewed by this user
    const reviewed = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("reviewedBy"), targetReviewerId))
      .collect();

    const approved = reviewed.filter((s) => s.state === "approved");
    const rejected = reviewed.filter((s) => s.state === "rejected");

    // Calculate stats
    const totalReviewed = reviewed.length;
    const approvalRate =
      totalReviewed > 0 ? approved.length / totalReviewed : 0;

    // Reviews by date (for charting)
    const reviewsByDate: Record<string, number> = {};
    for (const submission of reviewed) {
      if (submission.reviewedAt) {
        const date = submission.reviewedAt.split("T")[0];
        reviewsByDate[date] = (reviewsByDate[date] || 0) + 1;
      }
    }

    // Recent reviews (last 20)
    const recentReviews = reviewed
      .sort((a, b) => {
        const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 20);

    return {
      totalReviewed,
      approved: approved.length,
      rejected: rejected.length,
      approvalRate,
      reviewsByDate,
      recentReviews: await Promise.all(
        recentReviews.map(async (sub) => {
          const team = await ctx.db.get(sub.teamId);
          const submitter = await ctx.db.get(sub.userId);
          return {
            submissionId: sub._id,
            date: sub.date,
            state: sub.state,
            reviewedAt: sub.reviewedAt,
            teamName: team?.name,
            submitterName: submitter?.name,
          };
        }),
      ),
    };
  },
});
```

#### `submissionDisputes.list`

```typescript
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("investigating"),
        v.literal("resolved"),
        v.literal("escalated"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasPermission =
      user.roles.includes("admin") ||
      user.roles.includes("reviewer") ||
      user.roles.includes("tournament_manager");

    if (!hasPermission) {
      throw new Error("Reviewer, Tournament Manager, or Admin access required");
    }

    const query = args.status
      ? ctx.db
          .query("submissionDisputes")
          .withIndex("by_status", (q) => q.eq("status", args.status))
      : ctx.db.query("submissionDisputes");

    const disputes = await query.collect();

    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const submission = await ctx.db.get(dispute.submissionId);
        const flaggedBy = await ctx.db.get(dispute.flaggedBy);
        const resolvedBy = dispute.resolvedBy
          ? await ctx.db.get(dispute.resolvedBy)
          : null;
        const team = submission ? await ctx.db.get(submission.teamId) : null;

        return {
          ...dispute,
          submission: submission
            ? {
                id: submission._id,
                date: submission.date,
                description: submission.description,
              }
            : null,
          team: team ? { id: team._id, name: team.name } : null,
          flaggedBy: flaggedBy
            ? { id: flaggedBy._id, name: flaggedBy.name }
            : null,
          resolvedBy: resolvedBy
            ? { id: resolvedBy._id, name: resolvedBy.name }
            : null,
        };
      }),
    );

    return enriched;
  },
});
```

## Frontend Implementation

### New Components

#### `ReviewQueueTable`

**Location:** `src/components/reviewer/review-queue-table.tsx`

```typescript
interface ReviewQueueTableProps {
  submissions: Array<EnrichedSubmission>;
  onApprove: (submissionId: Id<"submissions">, notes?: string) => Promise<void>;
  onReject: (submissionId: Id<"submissions">, reason: string) => Promise<void>;
}

// Features:
// - TanStack Table with columns: Date, Team, Tournament, Description, Evidence, Actions
// - Inline approve/reject buttons
// - Click row to open detail modal
// - Checkbox for bulk selection
// - Filter by tournament, team
// - Sort by date, team name
// - Keyboard shortcuts (A = approve, R = reject, arrows navigate)
```

#### `SubmissionReviewModal`

**Location:** `src/components/reviewer/submission-review-modal.tsx`

```typescript
interface SubmissionReviewModalProps {
  submissionId: Id<"submissions">;
  onClose: () => void;
}

// Features:
// - Full submission details
// - Evidence images/links displayed prominently
// - Team and submitter information
// - Previous submissions by team (history)
// - Approve button (optional notes field)
// - Reject button (required reason field)
// - Flag for dispute button
// - Keyboard shortcuts (Esc = close, Ctrl+A = approve, Ctrl+R = reject)
```

#### `ReviewerStatsCards`

**Location:** `src/components/reviewer/reviewer-stats-cards.tsx`

```typescript
interface ReviewerStatsCardsProps {
  stats: {
    totalReviewed: number;
    approved: number;
    rejected: number;
    approvalRate: number;
  };
}

// Features:
// - Grid of stat cards (4 columns)
// - Total Reviewed: large number, trend indicator
// - Approved: count and percentage
// - Rejected: count and percentage
// - Approval Rate: percentage with progress circle
// - Color coding: green for approved, red for rejected
```

#### `ReviewActivityChart`

**Location:** `src/components/reviewer/review-activity-chart.tsx`

```typescript
interface ReviewActivityChartProps {
  reviewsByDate: Record<string, number>;
}

// Features:
// - Line or bar chart showing reviews per day
// - Last 30 days by default
// - Hover tooltips with exact counts
// - Highlight days with high activity
// - Use recharts or similar library
```

#### `DisputeQueueList`

**Location:** `src/components/reviewer/dispute-queue-list.tsx`

```typescript
interface DisputeQueueListProps {
  disputes: Array<EnrichedDispute>;
  onResolve: (
    disputeId: Id<"submissionDisputes">,
    resolution: string,
  ) => Promise<void>;
  onEscalate: (
    disputeId: Id<"submissionDisputes">,
    notes: string,
  ) => Promise<void>;
}

// Features:
// - List of disputed submissions
// - Each item shows: submission info, reason for dispute, flagged by
// - Actions: View Submission, Resolve, Escalate
// - Filter by status
// - Sort by date flagged
```

#### `ReviewerQuickActions`

**Location:** `src/components/reviewer/reviewer-quick-actions.tsx`

```typescript
// Features:
// - Grid of action buttons
// - "View Review Queue" (goes to pending submissions)
// - "View Disputes" (goes to dispute queue)
// - "View My Stats" (goes to statistics page)
// - Badge counts on buttons (pending count, open disputes)
```

### New Pages

#### `/reviewer/page.tsx`

**Location:** `src/app/(all)/reviewer/page.tsx`

```typescript
export default function ReviewerDashboard() {
  const { user } = useUser();
  const stats = useQuery(api.reviewer.getStatistics);
  const pendingCount = useQuery(api.reviewer.getReviewQueue, {
    state: "pending",
    limit: 1,
  })?.length;
  const disputes = useQuery(api.submissionDisputes.list, { status: "open" });

  // Redirect if not reviewer or admin
  if (!user?.roles?.includes("reviewer") && !user?.roles?.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reviewer Dashboard</h1>
        <p className="text-muted-foreground">
          Review and moderate submissions
        </p>
      </div>

      {/* Quick Actions */}
      <ReviewerQuickActions
        pendingCount={pendingCount || 0}
        disputeCount={disputes?.length || 0}
      />

      {/* Stats Cards */}
      {stats && <ReviewerStatsCards stats={stats} />}

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Review Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <ReviewActivityChart reviewsByDate={stats.reviewsByDate} />
          ) : (
            <Skeleton className="h-64" />
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <RecentReviewsList reviews={stats.recentReviews} />
          ) : (
            <Skeleton className="h-96" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `/reviewer/queue/page.tsx`

**Location:** `src/app/(all)/reviewer/queue/page.tsx`

```typescript
export default function ReviewQueuePage() {
  const { user } = useUser();
  const [selectedTournament, setSelectedTournament] = useState<Id<"tournaments"> | undefined>();
  const submissions = useQuery(api.reviewer.getReviewQueue, {
    state: "pending",
    tournamentId: selectedTournament,
    limit: 100,
  });
  const tournaments = useQuery(api.tournaments.list);

  const approveMutation = useMutation(api.submissions.approve);
  const rejectMutation = useMutation(api.submissions.reject);

  const handleApprove = async (submissionId: Id<"submissions">, notes?: string) => {
    await approveMutation({ submissionId, notes });
    toast.success("Submission approved");
  };

  const handleReject = async (submissionId: Id<"submissions">, reason: string) => {
    await rejectMutation({ submissionId, reason });
    toast.success("Submission rejected");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground">
            {submissions?.length || 0} pending submissions
          </p>
        </div>

        {/* Tournament Filter */}
        <Select
          value={selectedTournament}
          onValueChange={setSelectedTournament}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="All Tournaments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>All Tournaments</SelectItem>
            {tournaments?.map((t) => (
              <SelectItem key={t._id} value={t._id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {submissions ? (
        <ReviewQueueTable
          submissions={submissions}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <Skeleton className="h-96" />
      )}
    </div>
  );
}
```

#### `/reviewer/disputes/page.tsx`

**Location:** `src/app/(all)/reviewer/disputes/page.tsx`

```typescript
export default function DisputesPage() {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState<"open" | "investigating" | "escalated" | undefined>("open");
  const disputes = useQuery(api.submissionDisputes.list, { status: statusFilter });

  const resolveMutation = useMutation(api.submissionDisputes.resolve);
  const escalateMutation = useMutation(api.submissionDisputes.escalate);

  const handleResolve = async (disputeId: Id<"submissionDisputes">, resolution: string) => {
    await resolveMutation({ disputeId, resolution });
    toast.success("Dispute resolved");
  };

  const handleEscalate = async (disputeId: Id<"submissionDisputes">, notes: string) => {
    await escalateMutation({ disputeId, escalationNotes: notes });
    toast.success("Dispute escalated to admin");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispute Queue</h1>
          <p className="text-muted-foreground">
            {disputes?.length || 0} disputes
          </p>
        </div>

        {/* Status Filter */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="investigating">Investigating</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {disputes ? (
        <DisputeQueueList
          disputes={disputes}
          onResolve={handleResolve}
          onEscalate={handleEscalate}
        />
      ) : (
        <Skeleton className="h-96" />
      )}
    </div>
  );
}
```

### Modified Components

#### `Sidebar`

```typescript
// Add "Reviewer" section (show only if user has role):
// - Dashboard (/reviewer)
// - Review Queue (/reviewer/queue) - with pending count badge
// - Disputes (/reviewer/disputes) - with open count badge
// - My Stats (/reviewer/stats)
```

## UI/UX Considerations

### Dashboard Layout

```
┌───────────────────────────────────────────────────┐
│ Reviewer Dashboard                                │
│ Review and moderate submissions                   │
├───────────────────────────────────────────────────┤
│ [Review Queue: 24] [Disputes: 3] [My Stats]      │
├───────────────────────────────────────────────────┤
│ [Total: 450] [Approved: 380] [Rejected: 70]      │
│              [Approval Rate: 84%]                 │
├───────────────────────────────────────────────────┤
│ Review Activity (Last 30 Days)                    │
│ [Line chart showing reviews per day]              │
├───────────────────────────────────────────────────┤
│ Recent Reviews                                    │
│ - Team A, 2024-11-12, Approved                   │
│ - Team B, 2024-11-12, Rejected (incomplete)      │
│ ...                                               │
└───────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

- **Queue Navigation:**
  - `↑`/`↓`: Navigate between submissions
  - `Enter`: Open detail modal
  - `A`: Approve selected submission
  - `R`: Reject selected submission
  - `F`: Flag for dispute

- **Modal:**
  - `Esc`: Close modal
  - `Ctrl+A`: Approve
  - `Ctrl+R`: Reject (opens reason dialog)
  - `→`: Next submission
  - `←`: Previous submission

### Color Scheme

- **Stats Cards:** Blue (total), Green (approved), Red (rejected), Purple (approval rate)
- **Status Badges:** Yellow (pending), Green (approved), Red (rejected), Orange (disputed)
- **Action Buttons:** Green (approve), Red (reject), Yellow (flag)

### Real-Time Updates

- Queue updates automatically when new submissions arrive
- Toast notification: "New submission available for review"
- Badge counts update in real-time
- Stats refresh automatically

### Bulk Actions

- Select multiple submissions with checkboxes
- Bulk approve button (with confirmation dialog)
- Bulk reject button (must provide reason)
- Select all / clear selection shortcuts

## Testing Checklist

### Unit Tests

- [ ] Only reviewers/admins can access dashboard
- [ ] Approve increments team points correctly
- [ ] Reject with reason works
- [ ] Dispute creation works
- [ ] Stats calculate correctly

### Integration Tests

- [ ] Review queue loads submissions
- [ ] Approve/reject updates database
- [ ] Real-time updates work
- [ ] Dispute workflow works end-to-end
- [ ] Keyboard shortcuts work

### UI Tests

- [ ] Queue table renders
- [ ] Modal opens/closes correctly
- [ ] Bulk actions work
- [ ] Filters work
- [ ] Mobile responsive
- [ ] Loading states render

## Edge Cases

1. **Submission deleted while reviewer viewing**
   - Show error: "Submission no longer exists"
   - Remove from queue

2. **Another reviewer approves while current reviewing**
   - Show message: "Already reviewed by [name]"
   - Move to next submission

3. **No pending submissions**
   - Show empty state: "All caught up! 🎉"
   - Link to view past reviews

4. **Reviewer loses reviewer role**
   - Redirect to dashboard
   - Show toast notification

5. **Dispute on already approved submission**
   - Allow, but flag to admins
   - Don't automatically change state

## Performance Optimization

- Cache review queue for 5 seconds
- Paginate if queue >100 items
- Virtual scrolling for long lists
- Lazy load submission images
- Debounce filter inputs

## Migration & Deployment

### Migration Steps

1. **Update Schema**
   - Add `reviewedBy`, `reviewedAt`, `reviewNotes` to submissions
   - Create `submissionDisputes` table
   - Create `reviewerNotes` table (optional)
   - Deploy schema

2. **Update Backend**
   - Update approve/reject mutations
   - Add reviewer permission checks
   - Add reviewer queries
   - Add dispute mutations
   - Deploy backend

3. **Build Frontend**
   - Create reviewer components
   - Create dashboard and queue pages
   - Update sidebar
   - Deploy frontend

4. **Training**
   - Document reviewer workflow
   - Create review guidelines
   - Train reviewers on keyboard shortcuts

## Success Metrics

- 90%+ of reviewers visit dashboard daily during active tournaments
- <30 seconds average time per review
- <24 hours submission review turnaround time
- 80-90% approval rate (quality indicator)
- <5% dispute rate
- 90%+ reviewer satisfaction score

## Future Enhancements

- AI-assisted review suggestions
- Reviewer leaderboard (gamification)
- Review quality scoring
- Automated reviewer assignment (load balancing)
- Mobile app for on-the-go reviews
- Browser extension for quick reviews
- Review templates for common rejections
- Multi-language support
- Video evidence support
- Integration with external content moderation tools

## Dependencies

- Existing Convex backend
- Shadcn/ui components
- TanStack Table
- recharts (for activity chart)
- Lucide icons
- date-fns for date formatting
- React hooks (useQuery, useMutation, useUser)

## Open Questions

1. **Should reviewers be able to edit their past reviews?**
   - No - use dispute system for corrections

2. **How to handle reviewer disagreements?**
   - Escalate to admin via dispute system

3. **Should there be a review quota or target?**
   - Optional - can be added as gamification

4. **Allow reviewers to see who reviewed what?**
   - Yes - transparency for learning

5. **Should rejection reasons be visible to submitters?**
   - Yes - helps improve future submissions
