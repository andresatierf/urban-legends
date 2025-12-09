import { rolesToCreate } from "./data";
import type { UserWithRoles } from "./users";

/**
 * Role hierarchy map for efficient lookups.
 * Lower hierarchy number = higher privilege.
 */
const ROLE_HIERARCHY = new Map(
  rolesToCreate.map((role) => [role.name, role.hierarchy]),
);

/**
 * Type for role names in the system.
 */
export type RoleName =
  | "dev"
  | "admin"
  | "tournament_manager"
  | "reviewer"
  | "player"
  | "viewer";

/**
 * Validates that a user has at least the specified minimum role privilege.
 * Uses role hierarchy to check if user's role is equal to or higher than required.
 *
 * @param user - User with roles to validate
 * @param minimumRole - Minimum required role (e.g., "tournament_manager")
 * @param options - Configuration options
 * @throws Error if user doesn't have required role
 *
 * @example
 * // User must be admin or dev (higher than admin)
 * validateMinimumRole(user, "admin");
 *
 * @example
 * // User must be tournament_manager, admin, or dev
 * validateMinimumRole(user, "tournament_manager", {
 *   customMessage: "Tournament management access required"
 * });
 *
 * @example
 * // Check without throwing
 * if (!hasMinimumRole(user, "reviewer")) {
 *   return null; // early return instead of throw
 * }
 */
export function validateMinimumRole(
  user: UserWithRoles,
  minimumRole: RoleName,
  options?: {
    customMessage?: string;
  },
): void {
  if (!hasMinimumRole(user, minimumRole)) {
    const message =
      options?.customMessage ??
      `${minimumRole.replace("_", " ")} access or higher required`;
    throw new Error(message);
  }
}

/**
 * Checks if a user has at least the specified minimum role privilege.
 * Returns boolean instead of throwing.
 *
 * @param user - User with roles to check
 * @param minimumRole - Minimum required role
 * @returns true if user has required role or higher
 *
 * @example
 * const canManageTournaments = hasMinimumRole(user, "tournament_manager");
 * if (canManageTournaments) {
 *   // Show tournament management UI
 * }
 */
export function hasMinimumRole(
  user: UserWithRoles,
  minimumRole: RoleName,
): boolean {
  const requiredHierarchy = ROLE_HIERARCHY.get(minimumRole);
  if (requiredHierarchy === undefined) {
    throw new Error(`Unknown role: ${minimumRole}`);
  }

  return user.roleNames.some((roleName) => {
    const userRoleHierarchy = ROLE_HIERARCHY.get(roleName);
    return (
      userRoleHierarchy !== undefined && userRoleHierarchy <= requiredHierarchy
    );
  });
}

/**
 * Validates that a user has at least one of the specified roles.
 * Useful for cases where multiple specific roles are allowed (not hierarchy-based).
 *
 * @param user - User with roles to validate
 * @param allowedRoles - Array of allowed role names
 * @param options - Configuration options
 * @throws Error if user doesn't have any of the allowed roles
 *
 * @example
 * // User must be either reviewer OR admin (not hierarchy-based)
 * validateHasAnyRole(user, ["reviewer", "admin"]);
 */
export function validateHasAnyRole(
  user: UserWithRoles,
  allowedRoles: RoleName[],
  options?: {
    customMessage?: string;
  },
): void {
  if (!hasAnyRole(user, allowedRoles)) {
    const message =
      options?.customMessage ??
      `One of the following roles required: ${allowedRoles.join(", ")}`;
    throw new Error(message);
  }
}

/**
 * Checks if a user has at least one of the specified roles.
 * Returns boolean instead of throwing.
 *
 * @param user - User with roles to check
 * @param allowedRoles - Array of allowed role names
 * @returns true if user has any of the allowed roles
 */
export function hasAnyRole(
  user: UserWithRoles,
  allowedRoles: RoleName[],
): boolean {
  return allowedRoles.some((role) => user.roleNames.includes(role));
}
