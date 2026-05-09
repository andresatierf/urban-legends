# Admin Role Management UI

**Priority:** HIGH
**Status:** Backend Partial, UI Missing
**Estimated Effort:** 1 day

## Problem Statement

Currently, admin roles can only be assigned programmatically or via database. There is no UI for:

- Viewing user roles
- Assigning admin role to users
- Removing admin role from users
- Managing role-based permissions

The `addUserRole` mutation in `convex/admin.ts` is an empty stub (lines 42-48), and there's no UI to trigger role changes.

## Current State

### What Exists

- `setUserRole` mutation (in `convex/admin.ts`)
- `makeFirstUserAdmin` mutation for bootstrapping
- `getCurrentUserOrThrow` helper that injects roles
- User details page shows roles (read-only)
- RBAC enforcement in backend mutations

### What's Missing

- `addUserRole` mutation is empty stub
- No `removeUserRole` mutation
- No UI to change user roles
- No role selector component
- No confirmation dialogs
- No audit trail of role changes

### Evidence

- Lines 42-48 in `convex/admin.ts`:

```typescript
export const addUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement
  },
});
```

- Line 36 in `src/app/(all)/users/[userId]/page.tsx`: Shows roles but no edit capability

## Requirements

### Functional Requirements

1. **View User Roles**
   - Display all roles for a user (admin, user, etc.)
   - Show role assignment date
   - Show who assigned the role

2. **Assign Role**
   - Admin can assign roles to any user
   - Select from available roles (admin, user, custom roles)
   - Confirmation dialog required
   - Audit log entry created

3. **Remove Role**
   - Admin can remove roles from users
   - Cannot remove last "user" role (every user must have basic role)
   - Confirmation dialog required
   - Warning if removing admin from self

4. **Role Management**
   - List all available roles
   - Create new roles (optional for MVP)
   - View role descriptions
   - See which users have each role

5. **Permissions**
   - Only admins can manage roles
   - Self-demotion requires extra confirmation
   - Cannot remove admin from last admin user

### Non-Functional Requirements

- Role changes take effect immediately (Convex reactivity)
- Role assignment completes in <300ms
- Audit trail persists indefinitely
- Graceful error handling (e.g., cannot remove last admin)

## Database Schema Changes

### Modified Tables

```typescript
// convex/schema.ts

userRoles: defineTable({
  userId: v.id("users"),
  roleId: v.id("roles"),
  assignedBy: v.optional(v.id("users")), // NEW - who assigned this role
  assignedAt: v.optional(v.string()), // NEW - when assigned
})
  .index("by_user_role", ["userId", "roleId"])
  .index("by_user", ["userId"])
  .index("by_role", ["roleId"]),
```

### New Tables (Optional - for audit trail)

```typescript
roleChangeHistory: defineTable({
  userId: v.id("users"),
  roleId: v.id("roles"),
  action: v.union(v.literal("added"), v.literal("removed")),
  performedBy: v.id("users"),
  performedAt: v.string(),
  reason: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_performed_by", ["performedBy"])
  .index("by_date", ["performedAt"]),
```

## Backend Implementation

### Complete Existing Mutations

#### `admin.addUserRole` (complete implementation)

```typescript
export const addUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Verify current user is admin
    if (!currentUser.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Get role by name
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) {
      throw new Error(`Role "${args.roleName}" not found`);
    }

    // Check if user already has this role
    const existingUserRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q) =>
        q.eq("userId", args.userId).eq("roleId", role._id),
      )
      .first();

    if (existingUserRole) {
      throw new Error("User already has this role");
    }

    // Add role
    await ctx.db.insert("userRoles", {
      userId: args.userId,
      roleId: role._id,
      assignedBy: currentUser._id,
      assignedAt: new Date().toISOString(),
    });

    // Optional: Create audit log
    // await ctx.db.insert("roleChangeHistory", {
    //   userId: args.userId,
    //   roleId: role._id,
    //   action: "added",
    //   performedBy: currentUser._id,
    //   performedAt: new Date().toISOString(),
    // });

    return { success: true };
  },
});
```

### New Mutations

#### `admin.removeUserRole`

```typescript
export const removeUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (!currentUser.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Get role by name
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) {
      throw new Error(`Role "${args.roleName}" not found`);
    }

    // Special check: cannot remove "user" role
    if (args.roleName === "user") {
      throw new Error("Cannot remove basic user role");
    }

    // Special check: cannot remove last admin
    if (args.roleName === "admin") {
      const adminCount = await ctx.db
        .query("userRoles")
        .withIndex("by_role", (q) => q.eq("roleId", role._id))
        .collect();

      if (adminCount.length <= 1) {
        throw new Error("Cannot remove last admin user");
      }

      // Warn if removing admin from self (but allow it)
      if (args.userId === currentUser._id) {
        // Frontend should show extra confirmation for this
        console.warn("Admin removing admin role from self");
      }
    }

    // Find and remove userRole
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q) =>
        q.eq("userId", args.userId).eq("roleId", role._id),
      )
      .first();

    if (!userRole) {
      throw new Error("User does not have this role");
    }

    await ctx.db.delete(userRole._id);

    // Optional: Create audit log
    // await ctx.db.insert("roleChangeHistory", {
    //   userId: args.userId,
    //   roleId: role._id,
    //   action: "removed",
    //   performedBy: currentUser._id,
    //   performedAt: new Date().toISOString(),
    // });

    return { success: true };
  },
});
```

### New Queries

#### `admin.listRoles`

```typescript
export const listRoles = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const roles = await ctx.db.query("roles").collect();

    // For each role, count how many users have it
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await ctx.db
          .query("userRoles")
          .withIndex("by_role", (q) => q.eq("roleId", role._id))
          .collect();

        return {
          ...role,
          userCount: userCount.length,
        };
      }),
    );

    return rolesWithCounts;
  },
});
```

#### `admin.getUserRoleHistory`

```typescript
export const getUserRoleHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Fetch role change history for user
    const history = await ctx.db
      .query("roleChangeHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Join with roles and users
    const historyWithDetails = await Promise.all(
      history.map(async (entry) => {
        const role = await ctx.db.get(entry.roleId);
        const performedBy = await ctx.db.get(entry.performedBy);

        return {
          ...entry,
          roleName: role?.name,
          performedByName: performedBy?.name,
        };
      }),
    );

    return historyWithDetails;
  },
});
```

## Frontend Implementation

### New Components

#### `RoleSelector`

**Location:** `src/components/admin/role-selector.tsx`

```typescript
interface RoleSelectorProps {
  userId: Id<"users">;
  currentRoles: string[];
  onRoleChange: () => void;
}

// Features:
// - Dropdown showing all available roles
// - Checkboxes for multi-select (user can have multiple roles)
// - Highlight roles user currently has
// - Add/Remove buttons for each role
// - Confirmation dialogs
// - Toast notifications
```

#### `AssignRoleDialog`

**Location:** `src/components/admin/assign-role-dialog.tsx`

```typescript
interface AssignRoleDialogProps {
  userId: Id<"users">;
  userName: string;
  currentRoles: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Dialog with role dropdown
// - Select role to add
// - Show warning for admin role assignment
// - Confirm button
// - Calls `admin.addUserRole` mutation
// - Shows success toast
```

#### `RemoveRoleDialog`

**Location:** `src/components/admin/remove-role-dialog.tsx`

```typescript
interface RemoveRoleDialogProps {
  userId: Id<"users">;
  userName: string;
  roleName: string;
  isSelf: boolean; // Is this the current user?
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Confirmation dialog
// - Extra warning if removing admin from self
// - "Type role name to confirm" for admin removal
// - Calls `admin.removeUserRole` mutation
// - Shows success toast
// - Error handling (cannot remove last admin)
```

#### `RolesBadgeList`

**Location:** `src/components/admin/roles-badge-list.tsx`

```typescript
interface RolesBadgeListProps {
  roles: string[];
  editable?: boolean;
  onRemove?: (roleName: string) => void;
}

// Features:
// - Display roles as badges
// - Admin role highlighted in red/orange
// - User role in blue
// - Custom roles in gray
// - X button on each badge if editable
// - Click X triggers remove dialog
```

#### `RoleManagementCard`

**Location:** `src/components/admin/role-management-card.tsx`

```typescript
interface RoleManagementCardProps {
  userId: Id<"users">;
  userName: string;
  currentRoles: string[];
}

// Features:
// - Card component showing user's roles
// - RolesBadgeList with remove handlers
// - "Assign Role" button
// - Role change history (optional)
// - Used in user detail page
```

### Modified Pages

#### `/users/[userId]/page.tsx`

**Location:** `src/app/(all)/users/[userId]/page.tsx`

Update to include role management:

```typescript
export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const currentUser = useUser();
  const user = useQuery(api.users.get, { userId: params.userId as Id<"users"> });

  const isAdmin = currentUser?.roles.includes("admin");

  return (
    <div>
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>{user?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {user?.email}</p>

          {/* Roles Section */}
          {isAdmin ? (
            <RoleManagementCard
              userId={params.userId as Id<"users">}
              userName={user?.name || "User"}
              currentRoles={user?.roles || []}
            />
          ) : (
            <div>
              <p className="font-semibold">Roles:</p>
              <RolesBadgeList roles={user?.roles || []} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODO: Add teams table */}
    </div>
  );
}
```

### New Pages

#### `/admin/roles`

**Location:** `src/app/(all)/admin/roles/page.tsx`

```typescript
export default function AdminRolesPage() {
  const roles = useQuery(api.admin.listRoles);

  return (
    <div>
      <h1>Role Management</h1>

      <DataTable
        columns={[
          { header: "Role Name", accessorKey: "name" },
          { header: "Description", accessorKey: "description" },
          { header: "Users", accessorKey: "userCount" },
          { header: "Actions", cell: (row) => <RoleActionsMenu role={row} /> },
        ]}
        data={roles || []}
      />
    </div>
  );
}
```

## User Flows

### Flow 1: Admin Assigns Role

1. Admin navigates to user detail page
2. Sees current roles: ["user"]
3. Clicks "Assign Role" button
4. Dialog opens with role dropdown
5. Selects "admin" from dropdown
6. Warning appears: "This will grant admin privileges to John Doe"
7. Clicks "Confirm"
8. Mutation runs: `admin.addUserRole`
9. Dialog closes
10. Toast: "Admin role assigned to John Doe"
11. Roles update to ["user", "admin"]
12. Badge appears in list

### Flow 2: Admin Removes Role (Standard)

1. Admin viewing user with roles: ["user", "moderator"]
2. Clicks X on "moderator" badge
3. Confirmation dialog: "Remove moderator role from Jane Smith?"
4. Clicks "Remove"
5. Mutation runs: `admin.removeUserRole`
6. Role removed from database
7. Toast: "Moderator role removed"
8. Badge disappears
9. User still has ["user"]

### Flow 3: Self-Demotion Warning

1. Admin John views his own profile
2. Has roles: ["user", "admin"]
3. Clicks X on "admin" badge
4. EXTRA WARNING dialog:
   - "⚠️ You are removing admin access from yourself!"
   - "You will lose administrative privileges."
   - "Type 'admin' to confirm"
5. Types "admin"
6. Clicks "Remove"
7. Mutation succeeds
8. John no longer sees admin features
9. Redirect to dashboard (loses access to admin pages)

### Flow 4: Cannot Remove Last Admin

1. Admin tries to remove admin role from last admin user
2. Clicks X on "admin" badge
3. Mutation rejects: "Cannot remove last admin user"
4. Error dialog: "This is the last admin user. Assign admin to another user first."
5. Role not removed
6. User remains admin

## UI/UX Considerations

### Role Badge Colors

```typescript
const roleBadgeColors = {
  admin: "bg-red-100 text-red-800 border-red-500",
  user: "bg-blue-100 text-blue-800 border-blue-500",
  moderator: "bg-purple-100 text-purple-800 border-purple-500",
  custom: "bg-gray-100 text-gray-800 border-gray-500",
};
```

### Confirmation Patterns

- Standard role removal: Simple confirmation
- Admin role addition: Warning message
- Admin role removal from self: Type confirmation
- Last admin removal: Blocked with error

### Loading States

- Show skeleton while fetching roles
- Disable buttons during mutation
- Optimistic UI updates (add/remove badge immediately)

### Error Handling

- Toast for successful operations
- Dialog for errors
- Specific error messages (not generic "Something went wrong")

## Testing Checklist

### Unit Tests

- [ ] Only admins can add/remove roles
- [ ] Cannot remove last admin
- [ ] Cannot remove "user" role
- [ ] Cannot add duplicate role
- [ ] Self-demotion works with extra confirmation

### Integration Tests

- [ ] Add role → Role appears in user detail
- [ ] Remove role → Role removed from database
- [ ] Role change reflects in permissions immediately
- [ ] Audit trail records changes

### UI Tests

- [ ] Role badges display correctly
- [ ] Assign dialog shows available roles
- [ ] Remove confirmation appears
- [ ] Toast notifications show
- [ ] Loading states render
- [ ] Non-admins don't see edit buttons

## Security Considerations

1. **Permission Checks**
   - All role mutations verify admin access
   - Frontend also hides UI from non-admins (defense in depth)

2. **Audit Trail**
   - Who changed what, when
   - Immutable log for compliance

3. **Self-Demotion**
   - Allowed but requires extra confirmation
   - Cannot create deadlock (always have at least one admin)

4. **Role Validation**
   - Validate role exists before assigning
   - Prevent assignment of non-existent roles

## Edge Cases

1. **User deleted while editing roles**
   - Mutation fails with "User not found"
   - Show error, redirect to users list

2. **Role deleted while user has it**
   - UserRole entry remains (referential integrity)
   - Consider cascade delete (advanced)

3. **Concurrent role changes**
   - Last write wins (Convex handles atomicity)
   - Show refresh prompt if data stale

4. **Admin promotes user who's already admin**
   - Validation catches duplicate, shows error
   - "User already has this role"

## Migration Plan

1. **Schema Updates**
   - Add `assignedBy` and `assignedAt` to userRoles table
   - Backfill existing records with null values
   - Deploy schema changes

2. **Complete Backend**
   - Finish `addUserRole` implementation
   - Implement `removeUserRole` mutation
   - Implement queries for role management
   - Test in Convex dashboard

3. **Build UI Components**
   - Create RoleSelector component
   - Create AssignRoleDialog component
   - Create RemoveRoleDialog component
   - Test in isolation

4. **Integrate with Pages**
   - Update user detail page
   - Add role management card
   - Test end-to-end flows
   - Deploy to production

5. **Optional: Add Audit UI**
   - Create role change history page
   - Display timeline of changes
   - Filter by user, role, date

## Success Metrics

- Zero unauthorized role changes
- 100% of role changes logged in audit trail
- <300ms role assignment time (p95)
- Zero "last admin removed" incidents
- 95%+ of admins successfully use UI without documentation

## Future Enhancements

- Custom role creation (beyond admin/user)
- Role-based feature flags
- Temporary roles (expire after X days)
- Role request system (users request roles, admins approve)
- Batch role assignment (assign to multiple users)
- Role templates (preset combinations of permissions)
- Integration with external systems (LDAP, Okta, etc.)
