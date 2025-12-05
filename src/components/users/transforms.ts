import type { Doc } from "../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../convex/users";

// Type guard to check if a user object has roles (UserWithRoles)
export function isUserWithRoles(user: Doc<"users">): user is UserWithRoles {
  return (
    "roleNames" in user &&
    "roles" in user &&
    Array.isArray((user as UserWithRoles).roleNames) &&
    Array.isArray((user as UserWithRoles).roles)
  );
}

// Convert Doc<"users"> to UserWithRoles with safe fallback
export function toUserWithRoles(user: Doc<"users">): UserWithRoles {
  if (isUserWithRoles(user)) {
    return user;
  }
  // Fallback for users without roles loaded
  return {
    ...user,
    roles: [],
    roleNames: [],
  };
}
