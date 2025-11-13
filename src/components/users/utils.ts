import type { Doc } from "../../../convex/_generated/dataModel";

export function getInitials(name: string) {
  const names = name.split(" ");
  let initials = "";
  for (let i = 0; i < names.length; i++) {
    initials += names[i][0];
  }
  return initials;
}

export function getHighestRankingRole(roles: Doc<"roles">[]) {
  return roles.toSorted((a, b) => a.hierarchy - b.hierarchy).shift()
    ?.displayName;
}
