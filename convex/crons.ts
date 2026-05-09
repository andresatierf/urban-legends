import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily digest at 9:00 AM UTC
crons.daily(
  "send daily digest",
  { hourUTC: 9, minuteUTC: 0 },
  internal.notifications.sendDailyDigest,
);

// Cleanup old notifications at 2:00 AM UTC (low-traffic period)
crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications,
);

// Tournament notifications - run hourly (staggered to distribute load)
crons.hourly(
  "tournament 24h start warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournament24hWarnings,
);

crons.hourly(
  "tournament started notifications",
  { minuteUTC: 15 },
  internal.notifications.checkTournamentStarted,
);

crons.hourly(
  "tournament ending 24h warnings",
  { minuteUTC: 30 },
  internal.notifications.checkTournamentEnding24h,
);

crons.hourly(
  "tournament ended notifications",
  { minuteUTC: 45 },
  internal.notifications.checkTournamentEnded,
);

// Daily sweep of unclaimed pendingUploads rows older than 24 hours.
// Runs at 03:00 UTC — low-traffic window, after the 02:00 notification cleanup.
crons.daily(
  "sweep pending uploads",
  { hourUTC: 3, minuteUTC: 0 },
  internal.evidenceStorage.sweepOrphansCron,
);

export default crons;
