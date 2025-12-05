import type { DataModel, Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Converts an array of documents to a Map keyed by _id for efficient lookups.
 *
 * @param items - Array of Convex documents with _id field
 * @returns Map keyed by document ID
 */
export function toIdMap<T extends { _id: Id<any> }>(
  items: T[],
): Map<T["_id"], T> {
  return new Map(items.map((item) => [item._id, item]));
}

/**
 * Groups items by a key function.
 *
 * @param items - Array of items to group
 * @param keyFn - Function to extract the grouping key
 * @returns Map of grouped items
 */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  return items.reduce<Map<K, T[]>>((acc, item) => {
    const key = keyFn(item);
    const group = acc.get(key) ?? [];
    group.push(item);
    acc.set(key, group);
    return acc;
  }, new Map());
}

/**
 * Batch fetches documents by IDs with efficient querying.
 * Automatically deduplicates IDs.
 *
 * @param ctx - Query or Mutation context
 * @param tableName - Name of the table to query
 * @param ids - Array of document IDs to fetch
 * @returns Map of documents keyed by ID
 */
export async function batchGetByIds<T extends keyof DataModel>(
  ctx: QueryCtx | MutationCtx,
  tableName: T,
  ids: Id<T>[],
): Promise<Map<Id<T>, Doc<T>>> {
  if (ids.length === 0) return new Map();

  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(ids));

  // For small batches, use individual gets (more efficient)
  if (uniqueIds.length <= 5) {
    const docs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
    return new Map(
      docs
        .map((doc, i) => [uniqueIds[i], doc])
        .filter(([, doc]) => doc !== null) as Array<[Id<T>, Doc<T>]>,
    );
  }

  // For larger batches, use filter query
  const docs = await ctx.db
    .query(tableName)
    .filter((q) =>
      // @ts-expect-error - Generic table type makes this complex, but it's safe
      q.or(...uniqueIds.map((id) => q.eq(q.field("_id"), id))),
    )
    .collect();

  return toIdMap(docs);
}

/**
 * Enriches items with related documents by foreign key.
 *
 * @param ctx - Query or Mutation context
 * @param items - Items to enrich
 * @param foreignKeyFn - Function to extract foreign key from item
 * @param relatedTable - Table name of related documents
 * @returns Items enriched with related documents
 */
export async function enrichWithRelated<TItem, TTable extends keyof DataModel>(
  ctx: QueryCtx | MutationCtx,
  items: TItem[],
  foreignKeyFn: (item: TItem) => Id<TTable>,
  relatedTable: TTable,
): Promise<Array<TItem & { related: Doc<TTable> | null }>> {
  const foreignKeys = items.map(foreignKeyFn);
  const relatedMap = await batchGetByIds(ctx, relatedTable, foreignKeys);

  return items.map((item) => ({
    ...item,
    related: relatedMap.get(foreignKeyFn(item)) || null,
  }));
}

/**
 * Result of orphaned records detection.
 */
export type OrphanedRecordsResult = {
  orphanedTeams: Doc<"teams">[];
  orphanedSubmissions: Doc<"submissions">[];
  orphanedTeamMembers: Doc<"teamMembers">[];
};

/**
 * Detects orphaned records across the database.
 * Consolidated from admin.ts duplicate implementations.
 *
 * @param ctx - Query or Mutation context
 * @returns Object containing arrays of orphaned records
 */
export async function detectOrphanedRecords(
  ctx: QueryCtx | MutationCtx,
): Promise<OrphanedRecordsResult> {
  // Get all entities for validation
  const [tournaments, teams, submissions, users, teamMembers] =
    await Promise.all([
      ctx.db.query("tournaments").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("submissions").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("teamMembers").collect(),
    ]);

  // Build ID sets for fast lookup
  const tournamentIds = new Set(tournaments.map((t) => t._id));
  const teamIds = new Set(teams.map((t) => t._id));
  const userIds = new Set(users.map((u) => u._id));

  // Find orphaned teams (teams with non-existent tournaments)
  const orphanedTeams = teams.filter((t) => !tournamentIds.has(t.tournamentId));

  // Find orphaned submissions (submissions with non-existent teams or tournaments)
  const orphanedSubmissions = submissions.filter(
    (s) => !teamIds.has(s.teamId) || !tournamentIds.has(s.tournamentId),
  );

  // Find orphaned team members (members with non-existent teams or users)
  const orphanedTeamMembers = teamMembers.filter(
    (tm) => !teamIds.has(tm.teamId) || !userIds.has(tm.userId),
  );

  return {
    orphanedTeams,
    orphanedSubmissions,
    orphanedTeamMembers,
  };
}
