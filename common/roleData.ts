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

/** System roles — stored in `userRoles`, grant platform-wide authority. */
export type SystemRoleName = "dev" | "admin" | "organizer" | "player";

/** Tournament roles — stored in `tournamentRoles`, scoped to a single Tournament. */
export type TournamentRoleName = "tournament_manager" | "reviewer";

const systemRoles = [
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
    name: "organizer" as const,
    displayName: "Organizer",
    description:
      "Can create new tournaments. Does not grant management authority over created tournaments.",
    hierarchy: 2,
  },
  {
    name: "player" as const,
    displayName: "Player",
    description:
      "Default identity role granted to every user on signup. Does not gate capabilities on its own — playing in a tournament still requires being a member of one of its teams.",
    hierarchy: 5,
  },
] satisfies RoleDefinition[];

const tournamentRoles = [
  {
    name: "tournament_manager" as const,
    displayName: "Tournament Manager",
    description:
      "Can manage a specific tournament, approve submissions, and view analytics for that tournament",
    hierarchy: 3,
  },
  {
    name: "reviewer" as const,
    displayName: "Reviewer",
    description:
      "Can review and approve/reject submissions for a specific tournament",
    hierarchy: 4,
  },
] satisfies RoleDefinition[];

export const rolesToCreate = [...systemRoles, ...tournamentRoles];
