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

// Tournament notifications - run hourly
crons.hourly(
  "tournament 24h start warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournament24hWarnings,
);

crons.hourly(
  "tournament started notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentStarted,
);

crons.hourly(
  "tournament ending 24h warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnding24h,
);

crons.hourly(
  "tournament ended notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnded,
);

export default crons;
