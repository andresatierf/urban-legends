"use client";

import { usePathname } from "next/navigation";

/**
 * Hook to determine if a route is currently active based on the current pathname.
 *
 * @returns Object with isActive function and current pathname
 *
 * @example
 * ```tsx
 * const { isActive } = useActiveRoute();
 * const active = isActive('/dashboard', true); // exact match
 * const active = isActive('/tournaments'); // partial match
 * ```
 */
export function useActiveRoute() {
  const pathname = usePathname();

  /**
   * Check if a given href matches the current route.
   *
   * @param href - The route to check against
   * @param exact - If true, requires exact match. If false (default), matches if current path starts with href.
   * @returns true if the route is active
   */
  const isActive = (href: string, exact = false): boolean => {
    if (exact) {
      return pathname === href;
    }

    // Special case for root path
    if (href === "/") {
      return pathname === "/";
    }

    // Match if current path is exactly the href or is a subpath
    // This prevents false positives like /dashboard matching /dashboard-admin
    // or /team matching /teams
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return {
    isActive,
    pathname,
  };
}
