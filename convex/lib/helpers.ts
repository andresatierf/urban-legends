import { toMap } from "../../common/utils";
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
export function toIdMap<
  TTable extends keyof DataModel,
  T extends { _id: Id<TTable> },
>(items: T[]): Map<T["_id"], T> {
  return toMap(items, "_id");
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
 * Filters out any documents that don't exist.
 *
 * @param ctx - Query or Mutation context
 * @param tableName - Name of the table to query
 * @param ids - Array of document IDs to fetch
 * @returns Array of documents (non-null only)
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
 * Many-to-one enrichment spec: Single related document (e.g., team -> tournament)
 * Uses generic function type to allow proper item type inference at call site.
 * Supports nested enrichment via optional `enrich` property.
 */
type ManyToOneSpec<TTable extends keyof DataModel> = {
  table: TTable;
  foreignKey: (item: any) => Id<TTable>;
  enrich?: Record<string, AnyEnrichmentSpec>;
};

/**
 * One-to-many enrichment spec: Array of related documents (e.g., team -> teamMembers[])
 * Note: foreignKeyField uses string to allow proper type inference when used in specs.
 * The table type constraint ensures the correct document type is returned.
 * Supports nested enrichment via optional `enrich` property.
 */
type OneToManySpec<TTable extends keyof DataModel> = {
  table: TTable;
  foreignKeyField: string;
  itemKey?: (item: any) => string;
  enrich?: Record<string, AnyEnrichmentSpec>;
};

/**
 * Combined spec type with flexible constraint for inference.
 * Uses string intersection to allow literal type inference.
 */
type AnyEnrichmentSpec =
  | ManyToOneSpec<keyof DataModel & string>
  | OneToManySpec<keyof DataModel & string>;

/**
 * Helper type to extract table name from enrichment spec.
 */
type ExtractTable<TSpec> = TSpec extends { table: infer T }
  ? T extends keyof DataModel
    ? T
    : never
  : never;

/**
 * Helper type to determine result type based on enrichment spec.
 * - Many-to-one (foreignKey): returns Doc<Table> | null (with nested enrichment if specified)
 * - One-to-many (foreignKeyField): returns Doc<Table>[] (with nested enrichment if specified)
 */
type EnrichmentResultType<TSpec> = TSpec extends {
  foreignKey: unknown;
  enrich: infer TEnrich extends Record<string, AnyEnrichmentSpec>;
}
  ?
      | (Doc<ExtractTable<TSpec>> & {
          [K in keyof TEnrich]: EnrichmentResultType<TEnrich[K]>;
        })
      | null
  : TSpec extends { foreignKey: unknown }
    ? Doc<ExtractTable<TSpec>> | null
    : TSpec extends {
          foreignKeyField: unknown;
          enrich: infer TEnrich extends Record<string, AnyEnrichmentSpec>;
        }
      ? Array<
          Doc<ExtractTable<TSpec>> & {
            [K in keyof TEnrich]: EnrichmentResultType<TEnrich[K]>;
          }
        >
      : TSpec extends { foreignKeyField: unknown }
        ? Doc<ExtractTable<TSpec>>[]
        : never;

/**
 * Enriches items with multiple related documents in a single operation.
 * Supports both many-to-one and one-to-many relationships.
 * Supports nested enrichment for multi-level relationships.
 * More efficient than chaining multiple enrichWithRelated calls.
 *
 * @param ctx - Query or Mutation context
 * @param items - Items to enrich
 * @param specs - Record of enrichment specifications, keyed by desired property name
 * @returns Items enriched with all specified related documents
 *
 * @example
 * // Many-to-one relationships
 * const enriched = await enrichWithRelations(ctx, invitations, {
 *   team: { table: "teams", foreignKey: (inv) => inv.teamId },
 *   invitedByUser: { table: "users", foreignKey: (inv) => inv.invitedBy }
 * });
 * // Result: Array<Invitation & { team: Doc<"teams"> | null, invitedByUser: Doc<"users"> | null }>
 *
 * @example
 * // One-to-many relationships
 * const enriched = await enrichWithRelations(ctx, teams, {
 *   members: { table: "teamMembers", foreignKeyField: "teamId" },
 *   submissions: { table: "submissions", foreignKeyField: "teamId" }
 * });
 * // Result: Array<Team & { members: Doc<"teamMembers">[], submissions: Doc<"submissions">[] }>
 *
 * @example
 * // Mixed relationships
 * const enriched = await enrichWithRelations(ctx, teams, {
 *   tournament: { table: "tournaments", foreignKey: (team) => team.tournamentId },
 *   members: { table: "teamMembers", foreignKeyField: "teamId" }
 * });
 * // Result: Array<Team & { tournament: Doc<"tournaments"> | null, members: Doc<"teamMembers">[] }>
 *
 * @example
 * // Nested enrichment (multi-level)
 * const enriched = await enrichWithRelations(ctx, teams, {
 *   teamMembers: {
 *     table: "teamMembers",
 *     foreignKeyField: "teamId",
 *     enrich: {
 *       user: { table: "users", foreignKey: (m) => m.userId }
 *     }
 *   }
 * });
 * // Result: Array<Team & { teamMembers: Array<TeamMember & { user: Doc<"users"> | null }> }>
 */
export async function enrichWithRelations<
  TItem,
  const TSpecs extends Record<string, AnyEnrichmentSpec>,
>(
  ctx: QueryCtx | MutationCtx,
  items: TItem[],
  specs: TSpecs,
): Promise<
  Array<TItem & { [K in keyof TSpecs]: EnrichmentResultType<TSpecs[K]> }>
> {
  if (items.length === 0) return [];

  const enrichmentPromises = Object.entries(specs).map(
    async ([key, spec]: [string, AnyEnrichmentSpec]) => {
      if ("foreignKey" in spec) {
        const foreignKeys = items.map(spec.foreignKey);
        let relatedDocs = await batchGetDocuments(ctx, spec.table, foreignKeys);

        if (spec.enrich && relatedDocs.length > 0) {
          relatedDocs = await enrichWithRelations(
            ctx,
            relatedDocs,
            spec.enrich,
          );
        }

        const relatedMap = toIdMap(relatedDocs);
        return { key, spec, relatedMap, isArray: false };
      }

      const itemKeyFn = spec.itemKey || ((item: any) => item._id);
      const itemKeys = items.map(itemKeyFn);

      let relatedDocs = await ctx.db
        .query(spec.table)
        .filter((q) =>
          q.or(
            ...itemKeys.map((id) =>
              q.eq(q.field(spec.foreignKeyField as any), id),
            ),
          ),
        )
        .collect();

      if (spec.enrich && relatedDocs.length > 0) {
        relatedDocs = await enrichWithRelations(ctx, relatedDocs, spec.enrich);
      }

      const relatedMap = groupBy(
        relatedDocs,
        (doc: any) => doc[spec.foreignKeyField],
      );
      return { key, spec, relatedMap, isArray: true, itemKeyFn };
    },
  );

  const enrichmentResults = await Promise.all(enrichmentPromises);

  return items.map((item) => {
    const enriched: any = { ...item };
    for (const result of enrichmentResults) {
      if (result.isArray) {
        const itemKey = result.itemKeyFn?.(item);
        enriched[result.key] = result.relatedMap.get(itemKey) || [];
      } else {
        const foreignKey = (result.spec as any).foreignKey(item);
        enriched[result.key] = result.relatedMap.get(foreignKey) || null;
      }
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
