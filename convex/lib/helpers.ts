import { toMap } from "../../src/lib/utils";
import type { DataModel, Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// Re-export to keep dependencies clean
export { toMap };

/**
 * Converts an array of documents to a Map keyed by _id for efficient lookups.
 *
 * @param items - Array of Convex documents with _id field
 * @param [key] - Optional key instead of "_id"
 * @returns Map keyed by document ID
 */
export function toIdMap<T extends { _id: Id<any> }>(
  items: T[],
): Map<T["_id"], T> {
  return toMap(items, "_id");
  // return new Map(items.map((item) => [item[key], item]));
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
 * Batch fetches documents by IDs with efficient querying and returns them as an array.
 * Automatically deduplicates IDs.
 * Filters out any documents that don't exist, preserving order.
 *
 * @param ctx - Query or Mutation context
 * @param tableName - Name of the table to query
 * @param ids - Array of document IDs to fetch
 * @returns Array of documents (non-null only), in same order as input IDs
 */
export async function batchGetDocuments<T extends keyof DataModel>(
  ctx: QueryCtx | MutationCtx,
  tableName: T,
  ids: Id<T>[],
): Promise<Doc<T>[]> {
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length <= 5) {
    const docs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
    return docs.filter((doc) => doc !== null) as Array<Doc<T>>;
  }

  const docs = await ctx.db
    .query(tableName)
    .filter((q) =>
      // @ts-expect-error - Generic table type makes this complex, but it's safe
      q.or(...uniqueIds.map((id) => q.eq(q.field("_id"), id))),
    )
    .collect();

  return docs.filter((doc): doc is Doc<T> => doc !== undefined);
}

/**
 * Enriches items with related documents by foreign key.
 *
 * @param ctx - Query or Mutation context
 * @param items - Items to enrich
 * @param relatedTable - Table name of related documents
 * @param key - Key to store related documents in
 * @param foreignKeyFn - Function to extract foreign key from item
 * @returns Items enriched with related documents
 */
export async function enrichWithRelated<
  TItem,
  TTable extends keyof DataModel,
  TKey extends string,
>(
  ctx: QueryCtx | MutationCtx,
  items: TItem[],
  relatedTable: TTable,
  key: TKey,
  foreignKeyFn: (item: TItem) => Id<TTable>,
): Promise<Array<TItem & { [K in TKey]: Doc<TTable> | null }>> {
  const foreignKeys = items.map(foreignKeyFn);
  const relatedDocs = await batchGetDocuments(ctx, relatedTable, foreignKeys);
  const relatedMap = toIdMap(relatedDocs);

  return items.map((item) => ({
    ...item,
    [key]: relatedMap.get(foreignKeyFn(item)) || null,
  })) as Array<TItem & { [K in TKey]: Doc<TTable> | null }>;
}

/**
 * Enriches items with related documents array by foreign key.
 *
 * @param ctx - Query or Mutation context
 * @param items - Items to enrich
 * @param relatedTable - Table name of related documents
 * @param key - Key to store related documents in
 * @param foreignKeyFn - Function to extract foreign key from item
 * @param groupingFn - Function to extract grouping key from related doc
 * @returns Items enriched with related documents
 */
export async function enrichWithRelatedArray<
  TItem,
  TTable extends keyof DataModel,
  TKey extends string,
>(
  ctx: QueryCtx | MutationCtx,
  items: TItem[],
  relatedTable: TTable,
  key: TKey,
  foreignKeyFn: (item: TItem) => Id<TTable>,
  groupingFn: (doc: Doc<TTable>) => keyof Doc<TTable>,
): Promise<Array<TItem & { [K in TKey]: Doc<TTable>[] }>> {
  const foreignKeys = items.map(foreignKeyFn);
  const relatedDocs = await batchGetDocuments(ctx, relatedTable, foreignKeys);
  const relatedMap = groupBy(relatedDocs, groupingFn);

  return items.map((item) => ({
    ...item,
    [key]: relatedMap.get(foreignKeyFn(item)) || [],
  })) as Array<TItem & { [K in TKey]: Doc<TTable>[] }>;
}

/**
 * Specification for enriching items with a related document.
 */
export type EnrichmentSpec<TItem, TTable extends keyof DataModel> = {
  table: TTable;
  foreignKey: (item: TItem) => Id<TTable>;
};

/**
 * Helper type to extract table name from enrichment spec.
 */
type ExtractTableType<T> = T extends { table: infer TTable }
  ? TTable extends keyof DataModel
    ? TTable
    : never
  : never;

/**
 * Helper type for enriched result.
 */
type EnrichedResult<TItem, TSpecs> = TItem & {
  [K in keyof TSpecs]: Doc<ExtractTableType<TSpecs[K]>> | null;
};

/**
 * Enriches items with multiple related documents in a single operation.
 * More efficient than chaining multiple enrichWithRelated calls.
 *
 * @param ctx - Query or Mutation context
 * @param items - Items to enrich
 * @param specs - Record of enrichment specifications, keyed by desired property name
 * @returns Items enriched with all specified related documents
 *
 * @example
 * const enriched = await enrichWithRelations(ctx, invitations, {
 *   team: { table: "teams", foreignKey: (inv) => inv.teamId },
 *   invitedByUser: { table: "users", foreignKey: (inv) => inv.invitedBy }
 * });
 * // Result type: Array<Invitation & { team: Doc<"teams"> | null, invitedByUser: Doc<"users"> | null }>
 */
export async function enrichWithRelations<
  TItem,
  TSpecs extends Record<string, EnrichmentSpec<TItem, any>>,
>(
  ctx: QueryCtx | MutationCtx,
  items: TItem[],
  specs: TSpecs,
): Promise<Array<EnrichedResult<TItem, TSpecs>>> {
  if (items.length === 0) return [];

  // Fetch all relations in parallel
  const enrichmentPromises = Object.entries(specs).map(
    async ([key, spec]: [string, EnrichmentSpec<TItem, any>]) => {
      const foreignKeys = items.map(spec.foreignKey);
      const relatedDocs = await batchGetDocuments(ctx, spec.table, foreignKeys);
      const relatedMap = toIdMap(relatedDocs);
      return { key, spec, relatedMap };
    },
  );

  const enrichmentResults = await Promise.all(enrichmentPromises);

  // Build enrichment maps
  const enrichmentMaps = new Map(
    enrichmentResults.map((result) => [result.key, result]),
  );

  // Enrich all items
  return items.map((item) => {
    const enriched: any = { ...item };
    for (const [key, result] of Array.from(enrichmentMaps.entries())) {
      enriched[key] =
        result.relatedMap.get(result.spec.foreignKey(item)) || null;
    }
    return enriched;
  });
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
