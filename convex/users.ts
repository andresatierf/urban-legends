import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const [users, roles, userRoles] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("roles").collect(),
      ctx.db.query("userRoles").collect(),
    ]);

    return users.map((user) => ({
      ...user,
      roles: userRoles
        .filter((role) => role.userId === user._id)
        .map((role) => roles.find((r) => r._id === role.roleId)?.name),
    }));
  },
});
