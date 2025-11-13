# Code Quality Fixes Specification

**Priority:** High
**Status:** Ready for Implementation
**Created:** 2025-11-11

## Overview

This specification addresses all TypeScript type errors, linting issues, and formatting problems currently preventing the codebase from building successfully and passing quality checks.

## Current Issues Summary

### Type Errors (1 blocking build)

- **TournamentTeams.tsx:44** - Missing `members` property on team type returned from `api.teams.list`

### Lint Errors (10 errors)

1. **Non-null assertions (6 errors)** - Using `!` operator in unsafe contexts
2. **Unused imports (1 error)** - `validateIsAdmin` in `teamInvitations.ts`
3. **Unreachable code (1 error)** - Dead code after `throw` in `tournaments.ts`
4. **CSS at-rules (2 errors)** - Tailwind-specific at-rules flagged incorrectly

### Lint Warnings (26 warnings)

- **Non-null assertions (15 warnings)** - Unsafe `!` operators throughout codebase
- **Unused variables (4 warnings)** - Unused parameters and imports
- **CSS at-rules (4 warnings)** - Tailwind `@apply`, `@theme`, `@custom-variant`
- **Accessibility (2 warnings)** - Missing SVG titles, semantic HTML
- **Array index keys (1 warning)** - Using array index as React key

### Formatting Issues

- ✅ No formatting issues detected

## Implementation Plan

### Phase 1: Fix Type Errors

#### 1.1 Fix TournamentTeams Component

**File:** `src/components/TournamentTeams.tsx:44`

**Problem:** The `teams.list` query returns basic team objects without member data, but the component expects `team.members` property.

**Solution:** Use a separate query to fetch team members, or update the teams.list query to include member data.

**Approach:**

- Update `TournamentTeams` component to fetch team members separately using `api.teams.listMembers`
- Map team IDs to their members
- Display member emails from the mapped data

**Code Changes:**

```typescript
// Before (line 44)
{
  team.members?.map((m) => m.user.email).join(", ");
}

// After
// Fetch all members for all teams
const teamIds = teams.map((t) => t._id);
const allMembers = useQuery(api.teams.listMembers, { teamIds });
// Map members by teamId and display
```

---

### Phase 2: Fix Lint Errors

#### 2.1 Remove Unused Imports

**File:** `convex/teamInvitations.ts:5`

**Problem:** `validateIsAdmin` is imported but never used

**Solution:** Remove the unused import

```typescript
// Before
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

// After
import { getCurrentUserOrThrow } from "./users";
```

---

#### 2.2 Fix Unreachable Code

**File:** `convex/tournaments.ts:132-139`

**Problem:** Dead code after `throw new Error("Not implemented")`

**Solution:** Remove the unreachable code since the mutation is not implemented yet

```typescript
// Before
handler: async (ctx, args) => {
  throw new Error("Not implemented");
  const user = await getCurrentUserOrThrow(ctx);
  // ... more dead code
};

// After
handler: async (ctx, args) => {
  throw new Error("Not implemented");
};
```

---

#### 2.3 Configure CSS Linting

**Files:** `src/app/globals.css` - lines 4, 6, 119, 122

**Problem:** Biome doesn't recognize Tailwind-specific at-rules (`@custom-variant`, `@theme`, `@apply`)

**Solution:** Configure Biome to ignore these valid Tailwind CSS at-rules

**Action:** Update `biome.json` to disable `noUnknownAtRules` for CSS files:

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noUnknownAtRules": "off"
      }
    }
  }
}
```

---

### Phase 3: Fix Lint Warnings (Non-null Assertions)

Replace all unsafe non-null assertions (`!`) with proper null checking.

#### 3.1 Convex Backend Files

**File:** `convex/auth.config.ts:6`

```typescript
// Before
domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,

// After
domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "",
// OR validate at startup
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN is required");
}
domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
```

---

**File:** `convex/http.ts:26, 41-43, 45`

```typescript
// Before (line 26)
const clerkUserId = event.data.id!;

// After
const clerkUserId = event.data.id;
if (!clerkUserId) throw new Error("Missing user ID in webhook");

// Before (lines 41-43)
"svix-id": req.headers.get("svix-id")!,
"svix-timestamp": req.headers.get("svix-timestamp")!,
"svix-signature": req.headers.get("svix-signature")!,

// After
const svixId = req.headers.get("svix-id");
const svixTimestamp = req.headers.get("svix-timestamp");
const svixSignature = req.headers.get("svix-signature");

if (!svixId || !svixTimestamp || !svixSignature) {
  throw new Error("Missing Svix headers");
}

const svixHeaders = {
  "svix-id": svixId,
  "svix-timestamp": svixTimestamp,
  "svix-signature": svixSignature,
};

// Before (line 45)
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

// After
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error("CLERK_WEBHOOK_SECRET not configured");
const wh = new Webhook(webhookSecret);
```

---

**File:** `convex/submissions.ts:173`

```typescript
// Before
q.eq("userId", user._id).eq("state", args.state!);

// After
q.eq("userId", user._id).eq("state", args.state);
// Note: args.state is already validated by Convex schema
```

---

**File:** `convex/tournaments.ts:20, 83`

```typescript
// Before (line 20)
...args.tournamentIds!.map((tournamentId) =>

// After
...args.tournamentIds.map((tournamentId) =>
// Note: Already checked with conditional above

// Before (line 83)
.withIndex("by_name", (q) => q.eq("name", args.name!))

// After
.withIndex("by_name", (q) => q.eq("name", args.name))
// Note: args.name is validated by schema as required
```

---

**File:** `convex/teams.ts:23`

```typescript
// Before
.withIndex("by_user", (q) => q.eq("userId", args.userId!))

// After
.withIndex("by_user", (q) => q.eq("userId", args.userId))
// Note: Already inside conditional checking args.userId exists
```

---

**File:** `convex/users.ts:20`

```typescript
// Before
q.or(...args.userIds!.map((u) => q.eq(q.field("_id"), u)));

// After
q.or(...args.userIds.map((u) => q.eq(q.field("_id"), u)));
// Note: Already inside conditional checking args.userIds exists
```

---

#### 3.2 Frontend Files

**File:** `src/app/(all)/submissions/page.tsx:46-47`

```typescript
// Before
team: teamIdMap.get(submission.teamId)!,
user: userIdMap.get(submission.userId)!,

// After
const team = teamIdMap.get(submission.teamId);
const user = userIdMap.get(submission.userId);

if (!team || !user) {
  console.error("Missing team or user for submission", submission._id);
  return null; // Skip this submission
}

return {
  ...submission,
  team,
  user,
};
```

Update to use filter instead of map to remove null entries:

```typescript
const enrichedSubmissions = useMemo(
  () =>
    subs
      .map((submission) => {
        const team = teamIdMap.get(submission.teamId);
        const user = userIdMap.get(submission.userId);

        if (!team || !user) return null;

        return {
          ...submission,
          team,
          user,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null),
  [subs, teamIdMap, userIdMap],
);
```

---

**File:** `src/app/ConvexClientProvider.tsx:8`

```typescript
// Before
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {

// After
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexReactClient(convexUrl, {
```

---

### Phase 4: Fix Other Lint Warnings

#### 4.1 Fix Unused Variables

**File:** `convex/teams.ts:117`

```typescript
// Before
export const remove = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    // 'user' declared but never used

// After
// Option 1: Use the user variable for validation
const user = await getCurrentUserOrThrow(ctx);
await validateIsAdmin(ctx, user);

// Option 2: If not needed, remove it
// Just call getCurrentUserOrThrow for auth check
await getCurrentUserOrThrow(ctx);
```

Similar fixes for other unused variables in the codebase.

---

#### 4.2 Fix Accessibility Issues

**File:** `src/components/svg-icon.tsx:37`

```typescript
// Before
<svg
  className={svgVariants({ variant })}
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>

// After
<svg
  className={svgVariants({ variant })}
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
  role="img"
  aria-label={ariaLabel || "Icon"}
>
```

Add `ariaLabel` prop to component.

---

**File:** `src/components/ui/field.tsx:87, src/components/ui/input-group.tsx:13, 66`

Replace `role="group"` with semantic `<fieldset>` elements where appropriate, or add ignore comments if the structure is intentional.

---

**File:** `src/components/ui/field.tsx:210`

```typescript
// Before
{errors.map(
  (error, index) =>
    error?.message && <li key={index}>{error.message}</li>,
)}

// After
{errors.map((error) =>
  error?.message ? (
    <li key={error.message}>{error.message}</li>
  ) : null
)}
```

Use error message as key instead of array index.

---

## Testing Plan

### 1. Type Checking

```bash
bun run build
```

Expected: Build completes successfully with no type errors

### 2. Linting

```bash
bun run lint
```

Expected: 0 errors, 0 warnings (or only intentional suppressed warnings)

### 3. Formatting

```bash
bun run format
```

Expected: All files properly formatted

### 4. Auto-fix

```bash
bun run lint:fix
bun run format:fix
```

Expected: All auto-fixable issues resolved

### 5. Manual Testing

- Test TournamentTeams component displays members correctly
- Verify Clerk webhooks still work (authentication flow)
- Test submissions page displays team and user data
- Verify all pages load without console errors

---

## Edge Cases and Considerations

1. **Environment Variables**: Some non-null assertions on env vars should fail fast at startup rather than runtime
2. **Webhook Data**: Clerk webhook payloads should always have expected fields, but add validation for safety
3. **Database Queries**: When using optional filters, TypeScript knows the value exists in that branch
4. **CSS Linting**: Tailwind-specific at-rules are valid and needed, configure linter to allow them

---

## Files to Modify

### Convex Backend (11 files)

- `convex/auth.config.ts`
- `convex/http.ts`
- `convex/submissions.ts`
- `convex/teamInvitations.ts`
- `convex/teams.ts`
- `convex/tournaments.ts`
- `convex/users.ts`

### Frontend (4 files)

- `src/components/TournamentTeams.tsx`
- `src/app/(all)/submissions/page.tsx`
- `src/app/ConvexClientProvider.tsx`
- `src/components/svg-icon.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/input-group.tsx`

### Configuration (1 file)

- `biome.json`

---

## Success Criteria

✅ TypeScript build completes with 0 errors
✅ Biome lint passes with 0 errors
✅ Biome lint shows 0 warnings (or only acceptable ones)
✅ All pages render correctly
✅ No runtime errors in console
✅ Authentication flow works
✅ Team member display works
✅ Submissions page works

---

## Implementation Order

1. **Fix CSS linting config** (quick win, eliminates 6 warnings)
2. **Remove unused imports** (quick win)
3. **Fix unreachable code** (quick win)
4. **Fix environment variable assertions** (backend stability)
5. **Fix webhook assertions** (backend stability)
6. **Fix database query assertions** (backend cleanup)
7. **Fix TournamentTeams type error** (unblocks build)
8. **Fix submissions page assertions** (frontend stability)
9. **Fix accessibility warnings** (optional, but good practice)
10. **Run full test suite**

---

## Notes

- Most non-null assertions can be safely removed because Convex schema validation guarantees the values exist
- Environment variables should be validated at application startup
- Webhook validation adds defensive programming against malformed payloads
- CSS linting configuration is correct; Biome needs to be configured to recognize Tailwind CSS
- The TournamentTeams bug reveals that the query doesn't return the expected data shape; need to fetch members separately

---

## Future Enhancements

After these fixes are complete, consider:

1. Add runtime environment variable validation at startup
2. Create shared validation utilities for webhook payloads
3. Add TypeScript strict mode if not already enabled
4. Consider using Zod for runtime validation of external data
5. Add integration tests for webhook handlers
6. Audit other components for similar type issues

---

## Related Specs

- None (this is a code quality / technical debt spec)

---

## Checklist

- [ ] Update Biome configuration for CSS at-rules
- [ ] Fix all environment variable assertions
- [ ] Fix all webhook-related assertions
- [ ] Fix database query assertions
- [ ] Remove unused imports and variables
- [ ] Remove unreachable code
- [ ] Fix TournamentTeams type error
- [ ] Fix submissions page type errors
- [ ] Fix accessibility warnings
- [ ] Run type checking: `bun run build`
- [ ] Run linting: `bun run lint`
- [ ] Run formatting: `bun run format`
- [ ] Test authentication flow
- [ ] Test team display
- [ ] Test submissions page
- [ ] Verify no console errors
