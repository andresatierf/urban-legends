import type { Doc } from "../../../convex/_generated/dataModel";

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getHighestRankingRole(roles: Doc<"roles">[]) {
  return roles.toSorted((a, b) => a.hierarchy - b.hierarchy).shift()
    ?.displayName;
}
