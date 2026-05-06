/**
 * Backend-specific role utilities.
 * Re-exports shared role types from common directory.
 */

import type { UserWithRoles } from "./users";

// Re-export shared role type from common directory
export type { RoleName } from "../common/roles";

// Type assertion to ensure UserWithRoles has roleNames (compile-time check)
const _typeCheck: UserWithRoles extends { roleNames: string[] } ? true : never =
  true as const;
