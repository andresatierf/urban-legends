import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { rolesToCreate } from "./data";

/**
 * Initializes (or refreshes) the system roles table. Bootstrap entry point —
 * `role/admin.ts:makeFirstUserAdmin` calls this when the roles table is
 * empty. Idempotent.
 */
export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => upsertRoles(ctx),
});

async function upsertRoles(ctx: MutationCtx) {
  const upserted: string[] = [];
  for (const roleData of rolesToCreate) {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", roleData.name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: roleData.displayName,
        description: roleData.description,
        hierarchy: roleData.hierarchy,
      });
    } else {
      await ctx.db.insert("roles", roleData);
    }
    upserted.push(roleData.name);
  }
  return { roles: upserted };
}
