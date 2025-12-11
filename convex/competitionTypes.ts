/**
 * Competition Types Queries and Mutations
 *
 * Handles CRUD operations for competition types.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all competition types
 * Optionally filter by status
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("deprecated"),
        v.literal("archived"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Filter by status if provided
    const competitionTypes = args.status
      ? await ctx.db
          .query("competitionTypes")
          .withIndex("by_status", (q) =>
            q.eq("status", args.status as "active" | "deprecated" | "archived"),
          )
          .collect()
      : await ctx.db.query("competitionTypes").collect();

    // Sort by built-in first, then alphabetically by name
    return competitionTypes.sort((a, b) => {
      if (a.isBuiltIn && !b.isBuiltIn) return -1;
      if (!a.isBuiltIn && b.isBuiltIn) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get a single competition type by ID
 */
export const get = query({
  args: {
    id: v.id("competitionTypes"),
  },
  handler: async (ctx, args) => {
    const competitionType = await ctx.db.get(args.id);
    if (!competitionType) {
      throw new Error("Competition type not found");
    }
    return competitionType;
  },
});

/**
 * Get a competition type by slug and optional version
 * If no version specified, returns the latest version
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
    version: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.version !== undefined) {
      // Get specific version
      const competitionType = await ctx.db
        .query("competitionTypes")
        .withIndex("by_slug_and_version", (q) =>
          q.eq("slug", args.slug).eq("version", args.version as number),
        )
        .first();

      if (!competitionType) {
        throw new Error(
          `Competition type "${args.slug}" version ${args.version} not found`,
        );
      }
      return competitionType;
    }

    // Get latest version (highest version number)
    const allVersions = await ctx.db
      .query("competitionTypes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();

    if (allVersions.length === 0) {
      throw new Error(`Competition type "${args.slug}" not found`);
    }

    // Return the version with the highest version number
    return allVersions.reduce((latest, current) =>
      current.version > latest.version ? current : latest,
    );
  },
});
