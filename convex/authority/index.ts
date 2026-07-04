import { v } from "convex/values";

import { mutation, query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../users";
import {
  canCreateTournament,
  canGrantTournamentRole,
  canRevokeTournamentRole,
  computeActivityPermissions,
  computeSubmissionPermissions,
  computeTeamPermissions,
  computeTournamentPermissions,
  grantTournamentRole as grantTournamentRoleInternal,
  revokeTournamentRole as revokeTournamentRoleInternal,
} from "./core";

export const permissionsFor = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return computeSubmissionPermissions(ctx, user._id, args.submissionId);
  },
});

export const activityPermissionsFor = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return computeActivityPermissions(ctx, user._id, args.activityId);
  },
});

export const teamPermissionsFor = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return computeTeamPermissions(ctx, user._id, args.teamId);
  },
});

export const tournamentPermissionsFor = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return computeTournamentPermissions(ctx, user._id, args.tournamentId);
  },
});

export const systemPermissions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return {
      canCreateTournament: await canCreateTournament.check(ctx, user._id),
    };
  },
});

export const grantTournamentRole = mutation({
  args: {
    userId: v.id("users"),
    tournamentId: v.id("tournaments"),
    role: v.union(v.literal("tournament_manager"), v.literal("reviewer")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await canGrantTournamentRole.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });
    await grantTournamentRoleInternal(ctx, args);
  },
});

export const revokeTournamentRole = mutation({
  args: {
    userId: v.id("users"),
    tournamentId: v.id("tournaments"),
    role: v.union(v.literal("tournament_manager"), v.literal("reviewer")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await canRevokeTournamentRole.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });
    await revokeTournamentRoleInternal(ctx, args);
  },
});
