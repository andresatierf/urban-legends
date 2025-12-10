/**
 * Role definitions for the system.
 * This is the single source of truth for all roles and their hierarchy.
 */

export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  hierarchy: number;
}

/**
 * System roles with hierarchy.
 * Lower hierarchy number = higher privilege.
 */
export const rolesToCreate = [
  {
    name: "dev" as const,
    displayName: "Developer",
    description:
      "Full system access - can manage all tournaments, users, teams, and system settings. This role is reserved for developers only.",
    hierarchy: 0,
  },
  {
    name: "admin" as const,
    displayName: "Administrator",
    description:
      "Full system access - can manage all tournaments, users, teams, and system settings",
    hierarchy: 1,
  },
  {
    name: "tournament_manager" as const,
    displayName: "Tournament Manager",
    description:
      "Can create and manage tournaments, approve submissions, and view analytics for their tournaments",
    hierarchy: 2,
  },
  {
    name: "reviewer" as const,
    displayName: "Reviewer",
    description:
      "Can review and approve/reject submissions across all tournaments, moderate content, and handle disputes",
    hierarchy: 3,
  },
  {
    name: "player" as const,
    displayName: "Player",
    description:
      "Basic user access - can join teams and participate in tournaments",
    hierarchy: 4,
  },
  {
    name: "viewer" as const,
    displayName: "Viewer",
    description:
      "Read-only access to tournament statistics, leaderboards, and analytics",
    hierarchy: 5,
  },
] satisfies RoleDefinition[];
