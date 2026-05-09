# Code Cleanup: Remove Unused Components and Backend Functions

**Priority:** Medium
**Status:** Ready for Implementation
**Estimated Effort:** 2-3 days

---

## Problem Statement

The codebase has accumulated **26 unused exports** (13 frontend components/exports and 13 backend Convex functions) totaling approximately 25KB of dead code. This creates several issues:

1. **Maintenance Burden**: Developers must maintain and understand code that serves no purpose
2. **Increased Complexity**: Unused code makes it harder to navigate and understand the active codebase
3. **Build Size**: Dead code increases bundle size (though tree-shaking helps)
4. **Confusion**: Future developers may waste time trying to use or debug unused components
5. **Technical Debt**: Some functions have empty implementations or throw "Not implemented" errors

---

## Current State

### What Exists

**Frontend Unused Components (13):**

- `src/components/UserCard.tsx` - User card with teams display
- `src/components/UserStatsCard.tsx` - User statistics card
- `src/components/auth/sign-in-form.tsx` - Custom auth form (replaced by Clerk)
- `src/components/button-demo.tsx` - Button variant showcase
- `src/components/ui/confirm-button.tsx` - Confirmation button component
- `src/components/ui/date-picker.tsx` - Date picker component
- `src/components/teams/teams-data-table.tsx` - Teams data table
- `src/components/tournaments/tournaments-data-table.tsx` - Tournaments data table
- `src/components/ui/data-table/column-header.tsx` - Data table column header
- `src/components/ui/data-table/view-options.tsx` - Data table view options
- `src/components/ui/badge.tsx` - `badgeVariants` export (Badge component is used)
- `src/components/ui/button.types.ts` - Button type constants
- `src/components/ui/input.tsx` - `inputVariants` export (Input component is used)

**Backend Unused Functions (13):**

- `convex/admin.ts:makeFirstUserAdmin` - Bootstrap function (may be manual)
- `convex/admin.ts:addUserRole` - Empty stub implementation
- `convex/admin.ts:setUserRole` - Fully implemented but unused
- `convex/roles.ts:getByUserId` - Duplicates internal helper
- `convex/submissions.ts:getById` - No ownership check version
- `convex/submissions.ts:getUserSubmissions` - Specific date range query
- `convex/submissions.ts:getTeamSubmissions` - Specific date query
- `convex/tournaments.ts:remove` - Throws "Not implemented"
- `convex/tournaments.ts:determineWinner` - Admin utility (may be manual)
- `convex/teams.ts:create` - Legacy admin creation (incomplete)
- `convex/teams.ts:addMember` - Direct member addition
- `convex/teams.ts:recalculatePoints` - Admin data fix utility
- `convex/teams.ts:getTeams` - Internal helper (used once)

### What's Missing

- No systematic process for identifying and removing dead code
- No documentation of intentionally unused functions (e.g., admin utilities)
- Missing implementation for `tournaments.remove` despite UI integration

### Evidence

See `/home/andre/dev/urban-legends/UNUSED_COMPONENTS.md` for complete analysis with file paths, line numbers, sizes, and consolidation opportunities.

---

## Requirements

### Functional Requirements

1. **Remove Safe-to-Delete Components**
   - Delete development/demo components
   - Delete legacy components replaced by newer implementations
   - Delete components with no imports across the entire codebase

2. **Remove or Implement Stub Functions**
   - Either implement `tournaments.remove` or remove it and update UI
   - Remove `admin.addUserRole` empty stub
   - Decide on `admin.setUserRole` (implement UI or remove)

3. **Consolidate Duplicate Functions**
   - Consolidate submission getters (get vs getById)
   - Consolidate submission list queries (list, listUserSubmissions, getUserSubmissions)
   - Remove duplicate team creation functions
   - Remove duplicate member addition functions

4. **Document Manual/Admin Functions**
   - Add comments identifying functions intended for manual execution
   - Create admin utilities documentation if needed
   - Preserve bootstrap and data fix utilities with clear documentation

5. **Clean Up Unused Exports**
   - Make `badgeVariants` and `inputVariants` private if not needed externally
   - Remove or document button type constants usage

### Non-Functional Requirements

1. **Safety**: All removals must be verified with grep/search to ensure no dynamic imports
2. **Testing**: Run full test suite after each phase of removals
3. **Reversibility**: Commit each phase separately for easy rollback
4. **Documentation**: Update UNUSED_COMPONENTS.md as cleanup progresses
5. **Build Verification**: Ensure `bun run build` succeeds after each phase

---

## Implementation Plan

### Phase 1: Safe Frontend Removals (Low Risk)

**Files to Delete:**

1. `src/components/button-demo.tsx` - Development showcase component
2. `src/components/UserCard.tsx` - Legacy dashboard component
3. `src/components/UserStatsCard.tsx` - Legacy dashboard component
4. `src/components/auth/sign-in-form.tsx` - Replaced by Clerk

**Verification Steps:**

```bash
# Search for any imports before deleting
grep -r "button-demo" src/
grep -r "UserCard" src/
grep -r "UserStatsCard" src/
grep -r "sign-in-form" src/

# After deletion
bun run lint
bun run build
```

### Phase 2: Frontend Component Removals (Medium Risk)

**Files to Delete:**

1. `src/components/ui/confirm-button.tsx`
2. `src/components/ui/date-picker.tsx`
3. `src/components/teams/teams-data-table.tsx`
4. `src/components/tournaments/tournaments-data-table.tsx`
5. `src/components/ui/data-table/column-header.tsx`
6. `src/components/ui/data-table/view-options.tsx`

**Special Handling:**

- `teams-data-table.tsx` uses `DataTableSection` which IS used elsewhere - verify no indirect usage
- `tournaments-data-table.tsx` imports `api.tournaments.remove` which throws error - needs coordination with Phase 4

**Verification Steps:**

```bash
# Search for imports
grep -r "confirm-button" src/
grep -r "date-picker" src/
grep -r "teams-data-table" src/
grep -r "tournaments-data-table" src/
grep -r "column-header" src/
grep -r "view-options" src/

# After deletion
bun run lint
bun run build
```

### Phase 3: Frontend Export Cleanup (Low Risk)

**Files to Modify:**

1. `src/components/ui/badge.tsx`
   - Change `export const badgeVariants` to `const badgeVariants`
   - Verify no external usage first

2. `src/components/ui/input.tsx`
   - Change `export const inputVariants` to `const inputVariants`
   - Verify no external usage first

3. `src/components/ui/button.types.ts`
   - Evaluate if entire file can be removed or made private
   - Check usage in `ui/button.tsx` vs `button-demo.tsx` (removed in Phase 1)

**Verification Steps:**

```bash
# Search for variant imports
grep -r "badgeVariants" src/
grep -r "inputVariants" src/
grep -r "button.types" src/

# After changes
bun run lint
bun run build
```

### Phase 4: Backend Function Removals - High Priority (Safe)

**Functions to Remove:**

1. **`convex/admin.ts:42-48` - `addUserRole`**
   - Empty stub implementation
   - No frontend imports
   - Action: Delete function

2. **`convex/teams.ts:230-265` - `create`**
   - Incomplete (TODO on line 261)
   - Superseded by `upsertUserTeam`
   - Action: Delete function

3. **`convex/submissions.ts:189-196` - `getById`**
   - Redundant with `submissions.get`
   - Action: Delete function or add admin bypass flag to `get`

4. **`convex/submissions.ts:243-264` - `getUserSubmissions`**
   - Redundant with `submissions.list`
   - Action: Delete function

**Verification Steps:**

```bash
# Search for usage in frontend
grep -r "addUserRole" src/
grep -r "teams.create" src/
grep -r "submissions.getById" src/
grep -r "getUserSubmissions" src/

# After changes
bunx convex deploy --cmd dev
bun run build
```

### Phase 5: Backend Function Removals - Medium Priority (Review)

**Functions to Remove/Consolidate:**

1. **`convex/roles.ts:4-23` - `getByUserId`**
   - Duplicates `users.ts:116-127` internal helper
   - Action: Remove query, expose internal helper if needed externally

2. **`convex/teams.ts:267-300` - `addMember`**
   - Superseded by invitation system (`teamInvitations.inviteMember`)
   - Action: Remove unless needed for admin bulk operations

3. **`convex/submissions.ts:266-304` - `getTeamSubmissions`**
   - Very specific query for calendar view (spec 04)
   - Action: Check spec 04 status; if not planned, remove

**Verification Steps:**

```bash
grep -r "roles.getByUserId" src/
grep -r "teams.addMember" src/
grep -r "getTeamSubmissions" src/
```

### Phase 6: Backend Tournament Remove - Fix or Remove

**Problem:** `tournaments.remove` throws "Not implemented" but is imported in UI

**Option A: Implement Function**

```typescript
// convex/tournaments.ts:156-161
export const remove = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Check if tournament has teams/submissions
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .first();

    if (teams) {
      throw new Error("Cannot delete tournament with existing teams");
    }

    await ctx.db.delete(args.tournamentId);
  },
});
```

**Option B: Remove Function and Update UI**

- Delete `convex/tournaments.ts:156-161`
- Remove import from `src/components/tournaments/tournament-details-card.tsx:24`
- Remove import from `src/components/tournaments/tournaments-data-table.tsx:33`
- Remove delete button/action from UI components

**Decision Required:** Consult with product owner on tournament deletion requirements

### Phase 7: Document Admin/Manual Functions

**Functions to Keep and Document:**

1. **`convex/admin.ts:makeFirstUserAdmin`**
   - Purpose: Bootstrap first admin user
   - Usage: Manual execution via Convex dashboard
   - Action: Add JSDoc comment with instructions

2. **`convex/tournaments.ts:determineWinner`**
   - Purpose: Admin sets tournament winner
   - Usage: Manual or future admin UI
   - Action: Add JSDoc comment, consider adding to admin dashboard (spec 07)

3. **`convex/teams.ts:recalculatePoints`**
   - Purpose: Fix point calculation inconsistencies
   - Usage: Manual execution for data fixes
   - Action: Add JSDoc comment with usage instructions

**Documentation Format:**

```typescript
/**
 * ADMIN UTILITY - Manual Execution Only
 *
 * Makes the first user in the system an admin. This is a bootstrap
 * function intended to be run once after initial deployment.
 *
 * Usage:
 * 1. Deploy the application
 * 2. Create first user account via Clerk
 * 3. Run this mutation via Convex dashboard
 * 4. User will receive admin role
 *
 * @internal This function is not exposed to the frontend
 */
export const makeFirstUserAdmin = mutation({
  // ...
});
```

---

## Testing Strategy

### Automated Tests

1. **Build Verification**

   ```bash
   bun run lint
   bun run lint:fix
   bun run build
   ```

2. **Type Checking**
   - Ensure TypeScript compilation succeeds
   - No errors in `convex/_generated/` types

3. **Search Verification**
   - Use `grep -r` to verify no imports remain
   - Check for dynamic imports or string-based references

### Manual Testing Checklist

**After Each Phase:**

- [ ] Application starts successfully (`bun run dev` + `bunx convex dev`)
- [ ] All pages load without errors
- [ ] No console errors in browser
- [ ] Admin dashboard accessible
- [ ] Tournament CRUD operations work
- [ ] Team management works
- [ ] Submission flow works
- [ ] Authentication works

**Specific Tests:**

- [ ] Tournament deletion (if implementing Phase 6 Option A)
- [ ] Data table components still work (use DataTableSection directly)
- [ ] Form inputs and badges display correctly
- [ ] No broken imports in remaining components

---

## Edge Cases and Considerations

### Dynamic Imports

- Some components might be imported dynamically via `next/dynamic` or string-based imports
- Search for component names in string literals: `grep -r '"UserCard"' src/`

### Barrel Exports

- Check `index.ts` files that might re-export removed components
- Common locations: `src/components/index.ts`, `src/components/ui/index.ts`

### Documentation and Comments

- Search for component mentions in comments and markdown files
- Update or remove references in `CLAUDE.md`, `README.md`, etc.

### Third-Party Dependencies

- Some components might be used in Storybook stories (if present)
- Check for usage in test files

### Backend Function References

- Search for function names in:
  - Comments
  - String literals (e.g., for logging or error messages)
  - Migration scripts
  - Seed data scripts

---

## Success Metrics

1. **Code Reduction**
   - Remove ~25KB of unused frontend code
   - Remove ~13 unused backend functions
   - Reduce total export count by 26

2. **Build Performance**
   - Build time (should not increase)
   - Bundle size (may decrease slightly)

3. **Code Quality**
   - Zero linting errors
   - Zero build errors
   - All tests passing

4. **Documentation**
   - UNUSED_COMPONENTS.md updated or archived
   - Admin functions properly documented with JSDoc
   - CLAUDE.md updated if significant patterns change

---

## Rollback Plan

Each phase is committed separately with descriptive commit messages:

```
Phase 1: chore: remove demo and legacy frontend components
Phase 2: chore: remove unused UI components
Phase 3: refactor: make variant exports private
Phase 4: chore: remove stub and redundant backend functions
Phase 5: chore: consolidate backend query functions
Phase 6: feat: implement tournament deletion OR chore: remove unimplemented tournament deletion
Phase 7: docs: document admin utility functions
```

If issues arise:

```bash
git revert <commit-hash>  # Revert specific phase
git reset --hard HEAD~1   # Undo last commit (if not pushed)
```

---

## Open Questions

1. **Tournament Deletion**: Should we implement `tournaments.remove` or remove it entirely?
   - Impact: Admin capability to delete tournaments
   - Risk: Data loss if teams/submissions exist

2. **Admin Role Management**: Should we implement `admin.setUserRole` UI?
   - Referenced in spec 05 (admin-role-management)
   - Needs decision on single vs multiple role assignment

3. **Submission Calendar**: Is spec 04 (submission-calendar) still planned?
   - Affects decision to keep `submissions.getTeamSubmissions`
   - May need calendar-specific queries

4. **Button Type Constants**: Should `button.types.ts` be removed entirely?
   - Only used in `button-demo.tsx` (removed) and `ui/button.tsx`
   - Could inline constants into `button.tsx`

5. **Data Table Components**: Should we document `DataTableSection` as the preferred approach?
   - Remove specialized data tables in favor of generic `DataTableSection`
   - Update documentation with best practices

---

## Dependencies

**Blocked By:**

- None

**Blocks:**

- Spec 07 (admin-dashboard) - Admin utility functions need documentation before dashboard integration

**Related Specs:**

- Spec 04 (submission-calendar) - May affect `submissions.getTeamSubmissions` decision
- Spec 05 (admin-role-management) - May affect `admin.setUserRole` decision
- Spec 07 (admin-dashboard) - Admin utilities could be exposed in dashboard UI

---

## Migration & Deployment

### Pre-Deployment Checklist

- [ ] All phases tested locally
- [ ] Build succeeds without errors
- [ ] No console errors in development
- [ ] Manual testing checklist complete
- [ ] UNUSED_COMPONENTS.md updated or archived

### Deployment Steps

1. Merge cleanup PR to main branch
2. Deploy Convex backend: `bunx convex deploy --prod`
3. Deploy Next.js frontend (automatic via hosting provider)
4. Monitor logs for any errors
5. Verify application functionality in production

### Post-Deployment Verification

- [ ] Production application loads successfully
- [ ] No JavaScript console errors
- [ ] Core user flows work (auth, tournaments, teams, submissions)
- [ ] Admin functionality works

### Rollback Procedure

If critical issues discovered in production:

1. Revert the PR merge in git
2. Redeploy Convex backend: `bunx convex deploy --prod`
3. Redeploy frontend
4. Investigate and fix issues in development
5. Re-deploy cleanup with fixes

---

## Notes

- This is a **code hygiene** task, not a feature addition
- Low risk if done methodically in phases
- High value for long-term maintainability
- Should be done before major refactoring efforts
- Consider periodic cleanup audits (quarterly/bi-annually)

---

## Appendix: Consolidation Recommendations

### Submission Queries Consolidation

**Current State:**

- `submissions.list` - Flexible query with many filters
- `submissions.listUserSubmissions` - Get current user's submissions
- `submissions.getUserSubmissions` - Get user submissions for team/date range
- `submissions.getTeamSubmissions` - Get team submissions for specific date

**Recommendation:**
Keep `submissions.list` as the primary query. It can handle all use cases with proper filtering. Remove the specialized queries unless performance benchmarking shows significant benefits to the specific queries.

### Team Management Consolidation

**Current State:**

- `teams.create` (admin, incomplete) vs `teams.upsertUserTeam` (user/admin, complete)
- `teams.addMember` (admin direct) vs `teamInvitations.inviteMember` (invitation flow)

**Recommendation:**

- Remove `teams.create` - superseded by `upsertUserTeam`
- Keep `teams.addMember` ONLY if bulk admin operations are needed
- Otherwise, use invitation system for all member additions (better audit trail)

### Role Management Consolidation

**Current State:**

- `roles.getByUserId` (query) vs internal `getRolesForUser` in `users.ts`
- Both do the same thing

**Recommendation:**
Either expose the internal helper as a query, or keep the query and remove the internal helper. Avoid duplication.
