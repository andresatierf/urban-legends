import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../users";
import { computeSubmissionPermissions } from "./core";

export const permissionsFor = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return computeSubmissionPermissions(ctx, user._id, args.submissionId);
  },
});
