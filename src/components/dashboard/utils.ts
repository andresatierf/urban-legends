export function extractName(description: string): string {
  const match = description.match(/^([A-Z][a-z]+)/);
  return match ? match[1] : "Your teammate";
}

export function activityDotColorClass(type: string): string {
  if (type === "submission_approved") return "bg-grass";
  if (type === "team_member_joined") return "bg-sky";
  if (type.includes("join_request")) return "bg-plum";
  if (type === "submission_rejected") return "bg-sunset";
  return "bg-mute";
}

export function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
