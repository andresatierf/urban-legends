/**
 * Backend-specific role utilities.
 * Re-exports shared role functions from common directory.
 */

import type { UserWithRoles } from "./users";

// Re-export all shared role utilities from common directory
export {
  hasAnyRole,
  hasMinimumRole,
  type RoleName,
  type UserWithRoleNames,
  validateHasAnyRole,
  validateMinimumRole,
} from "../common/roles";

// Type assertion to ensure UserWithRoles is compatible with UserWithRoleNames
// This compile-time check ensures backend UserWithRoles works with shared functions
const _typeCheck: UserWithRoles extends { roleNames: string[] } ? true : never =
  true as const;
