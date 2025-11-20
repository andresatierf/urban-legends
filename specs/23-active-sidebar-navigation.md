# Spec 23: Active Sidebar Navigation Highlighting

**Status**: Draft
**Created**: 2025-11-20
**Owner**: Andre

## Overview

Implement visual highlighting for sidebar navigation items to indicate the current page/section the user is viewing. This improves navigation clarity and helps users understand their current location within the application.

## Motivation

Currently, the sidebar navigation does not provide visual feedback about which page the user is currently on. This can make it difficult for users to orient themselves within the application, especially when navigating between similar sections or after following deep links.

## Goals

1. Highlight the active navigation item in the sidebar based on the current route
2. Support nested route matching (e.g., `/tournaments/123` should highlight the "Tournaments" item)
3. Maintain visual consistency with the existing design system
4. Provide smooth visual transitions when navigating between pages
5. Support both exact and partial route matching depending on the navigation item

## Non-Goals

- Implementing breadcrumb navigation
- Changing the overall sidebar layout or structure
- Adding hover state animations (unless currently missing)
- Mobile navigation drawer implementation (separate concern)

## Technical Design

### 1. Route Matching Logic

**Location**: `src/components/` (identify existing sidebar component)

Create a utility hook for determining active navigation state:

```typescript
// src/hooks/useActiveRoute.ts
import { usePathname } from 'next/navigation';

export function useActiveRoute() {
  const pathname = usePathname();

  return {
    isActive: (href: string, exact = false) => {
      if (exact) {
        return pathname === href;
      }
      // Match if current path starts with the href
      return pathname.startsWith(href);
    },
    pathname,
  };
}
```

### 2. Navigation Item Types

Identify and document the existing navigation structure. Expected items:

**Admin Routes**:
- Dashboard (`/dashboard`)
- Tournaments (`/admin/tournaments` or `/tournaments`)
- Teams (`/admin/teams` or `/teams`)
- Users (`/admin/users` or `/users`)
- Submissions (`/submissions`)

**User Routes**:
- Dashboard (`/dashboard`)
- My Teams (`/teams`)
- Tournaments (`/tournaments`)
- Submissions (`/submissions`)

### 3. Visual States

Define three visual states for navigation items:

1. **Active State** (current page):
   - Background: `bg-primary/10` or `bg-accent`
   - Text: `text-primary` or `text-accent-foreground`
   - Font weight: `font-semibold`
   - Border or indicator: Left border `border-l-4 border-primary`

2. **Hover State** (interactive):
   - Background: `bg-accent/50` or `hover:bg-accent/50`
   - Smooth transition: `transition-colors duration-200`

3. **Default State**:
   - Background: `transparent`
   - Text: `text-muted-foreground`
   - Font weight: `font-normal`

### 4. Component Updates

**Identify the sidebar component** (likely in `src/components/` or `src/app/layout.tsx`):

Update the navigation item component to use the active route hook:

```typescript
interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean; // For items that should only match exact routes
}

function NavItem({ href, icon: Icon, label, exact = false }: NavItemProps) {
  const { isActive } = useActiveRoute();
  const active = isActive(href, exact);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200",
        active
          ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", active && "text-primary")} />
      <span>{label}</span>
    </Link>
  );
}
```

### 5. Special Cases

**Dashboard Route** (`/dashboard`):
- Should use **exact matching** since many routes start with `/dashboard`
- Example: `<NavItem href="/dashboard" exact={true} ... />`

**Nested Routes**:
- Tournament detail pages (`/tournaments/[id]`) should highlight "Tournaments"
- Team detail pages (`/teams/[id]`) should highlight "Teams"
- Use partial matching (default behavior)

**Route Groups**:
- Since admin routes are in `(all)` group, ensure matching works correctly
- Test with both `/tournaments` and `/admin/tournaments` patterns

## Implementation Steps

1. **Locate existing sidebar component**
   - Search for navigation/sidebar components in `src/components/` and `src/app/layout.tsx`
   - Document current structure and styling

2. **Create `useActiveRoute` hook**
   - Implement route matching logic
   - Add TypeScript types
   - Add unit tests if testing infrastructure exists

3. **Update navigation item component**
   - Add active state styling
   - Integrate `useActiveRoute` hook
   - Apply visual state classes

4. **Configure route matching rules**
   - Set `exact={true}` for Dashboard
   - Use partial matching for section-level navigation
   - Test with dynamic routes

5. **Visual refinement**
   - Verify colors match design system
   - Test with both light and dark themes
   - Ensure sufficient contrast for accessibility

6. **Testing**
   - Test all navigation items in both admin and user contexts
   - Verify nested route highlighting (e.g., `/tournaments/123`)
   - Test route transitions and visual feedback
   - Test on mobile sidebar (if applicable)

## UI/UX Considerations

### Visual Design

- The active state should be **immediately noticeable** but not overwhelming
- Maintain sufficient color contrast (WCAG AA standard: 4.5:1 for text)
- Consider using both color and a visual indicator (left border) for accessibility
- Ensure compatibility with dark theme (if implemented)

### Interaction

- Active state should appear **instantly** on route change (no loading delay)
- Smooth transitions between states (200ms duration recommended)
- No flickering during client-side navigation

### Edge Cases

- What happens if no routes match (shouldn't occur in practice)?
- Multiple items could technically match (prioritize most specific match)
- Hash links and query parameters should not affect matching

## Accessibility

- Active state must be perceivable to screen readers
- Consider adding `aria-current="page"` to active navigation items:
  ```typescript
  <Link
    href={href}
    aria-current={active ? "page" : undefined}
    className={...}
  >
  ```
- Ensure keyboard navigation still works as expected
- Maintain focus visibility for keyboard users

## Open Questions

1. **Where is the sidebar component located?**
   - Need to identify existing navigation component
   - May be in layout.tsx or separate component file

2. **Does the sidebar exist on all pages?**
   - Auth pages might not have sidebar
   - Confirm behavior for `(auth)` route group

3. **Are there any existing active state styles?**
   - Check for any current highlighting implementation
   - May need to replace or enhance existing behavior

4. **Mobile navigation?**
   - Does the app have a mobile sidebar/drawer?
   - Should active states work the same way on mobile?

5. **Theme compatibility?**
   - Verify colors work with dark theme (if spec 21 is implemented)
   - May need theme-aware color tokens

## Success Metrics

- Users can immediately identify their current location in the app
- Navigation feels responsive with smooth visual feedback
- All route patterns (exact, nested, dynamic) work correctly
- Accessibility standards are met (WCAG AA)
- Visual design is consistent with existing UI

## Future Enhancements

- Animate the active indicator on route changes
- Add breadcrumb navigation for deep nested routes
- Implement "Recently Visited" section in sidebar
- Add route-based page titles/headers that sync with sidebar highlighting
