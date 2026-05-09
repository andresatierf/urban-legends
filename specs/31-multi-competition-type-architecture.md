# Feature Specification: Multi-Competition Type Architecture

**Status**: Draft
**Created**: 2025-11-28
**Complexity**: Large (2-3 weeks implementation)
**Priority**: High - Foundation for Platform Extensibility

---

## 1. Executive Summary

### Overview

The Urban Legends tournament platform is currently hardcoded to support a single competition format: daily activity tracking with team/individual submissions, tier-based scoring (base/advanced), and team exercise thresholds. While this works for the current use case, the platform cannot easily accommodate different types of competitions such as photo contests, code challenges, scavenger hunts, or fitness challenges without significant code changes.

This specification defines a comprehensive refactoring to introduce a **Competition Type System** that decouples competition rules from the core platform infrastructure. The new architecture will enable administrators to create tournaments with different competition formats, each having:

- **Custom submission schemas** (what data teams/users need to provide)
- **Flexible scoring methods** (how points are calculated)
- **Configurable validation rules** (what makes a valid submission)
- **Type-specific UI components** (forms, displays, leaderboards)

### Primary Benefits

1. **Extensibility**: Add new competition types without modifying core code
2. **Flexibility**: Support diverse competition formats on the same platform
3. **Reusability**: Share common infrastructure (teams, tournaments, users, roles)
4. **Maintainability**: Clear separation between competition logic and platform logic
5. **Scalability**: Different competitions can have different complexity levels

### Expected Timeline

- **Foundation (Week 1)**: Schema migration, competition type registry, base scoring engine
- **Implementation (Week 2)**: Refactor submissions system, dynamic forms, scoring plugins
- **Integration (Week 3)**: UI components, tournament creation flow, testing, migration

### Business Value

- **Increased Usage**: Support more types of events on the same platform
- **Lower Maintenance**: New competition types don't require platform changes
- **Competitive Advantage**: Multi-purpose platform vs single-purpose competitors
- **Future-Proofing**: Easy to add seasonal events, special formats, experimental modes

---

## 2. Current State Analysis

### Architectural Limitations

#### 2.1 Hardcoded Submission Schema

**Location**: `convex/schema.ts` (lines 68-97)

The `submissions` table has a fixed schema that assumes:

- `submissionType`: Only "individual" or "team"
- `tier`: Only "base" or "advanced"
- `description`: Optional text field
- `pointsEarned`: Single numeric value

**Problem**: Cannot support competitions that need:

- Photo URLs or file references
- Multiple numeric metrics (distance, time, calories)
- Structured data (GPS coordinates, routes, recipes)
- Completion proofs (transaction IDs, verification codes)

#### 2.2 Hardcoded Scoring Logic

**Location**: `convex/submissions.ts` (lines 54-177), `convex/submissionGroups.ts` (lines 18-90)

Scoring calculation is tightly coupled to the current competition format:

```typescript
// Current scoring logic (simplified)
const scoringConfig = tournament.scoringConfig || {
  individualPoints: { base: 1, advanced: 1 },
  teamExercisePoints: { base: 1, advanced: 1 },
  teamExerciseThreshold: 0.5,
};

const pointsEarned = isTeamExercise
  ? scoringConfig.teamExercisePoints[tier]
  : scoringConfig.individualPoints[tier];
```

**Problem**: Cannot support:

- Formula-based scoring (distance × difficulty multiplier)
- Ranked scoring (1st place: 100pts, 2nd: 80pts, etc.)
- Cumulative scoring (sum of multiple metrics)
- Comparative scoring (better than average = bonus)
- Time-based scoring (faster = more points)

#### 2.3 Fixed Submission Form

**Location**: `src/components/form/upsert-submission-form.tsx`

The submission form has hardcoded fields:

- Team selector
- Description (text)
- Date picker
- Submission type (individual/team)
- Tier (base/advanced)

**Problem**: Cannot dynamically generate forms for competitions that need:

- Image uploads
- Multiple numeric inputs
- Dropdown selections
- GPS/map pickers
- File attachments

#### 2.4 Monolithic Validation

**Location**: `convex/submissions.ts` (lines 277-467)

Validation logic is embedded in the `upsert` mutation:

- Daily submission limits
- Team activity uniqueness constraints
- Team membership checks
- Tournament date boundaries

**Problem**: Different competition types need different rules:

- Photo contests: require at least one image
- Fitness challenges: require distance/time/calories
- Scavenger hunts: require proof of completion
- Code challenges: require valid code submission

#### 2.5 Approval Workflow Assumptions

**Location**: `convex/submissions.ts` (approve/reject mutations)

Current workflow assumes:

- All submissions need manual approval
- Approval is binary (approved/rejected)
- Team submissions are grouped and approved together

**Problem**: Some competitions might need:

- Auto-approval (trust-based systems)
- Multi-stage approval (preliminary → final)
- Automated validation (API checks, file analysis)
- Partial credit scoring

### Existing Strengths to Preserve

Despite the limitations, the current architecture has strengths we must maintain:

1. **Clean Convex Integration**: Real-time data, typed queries/mutations
2. **Role-Based Access Control**: Admin, tournament manager, reviewer, user separation
3. **Team Management**: Robust team creation, invitations, join requests
4. **Submission Groups**: Team activity coordination is well-designed
5. **UI Component Patterns**: TanStack Form/Table, shadcn/ui consistency
6. **Date Handling**: UTC date normalization (Spec 20)

---

## 3. Feature Requirements

### Functional Requirements

#### FR1: Competition Type Definition

**Requirement**: Administrators can define reusable competition types with:

- Type identifier (slug: "daily-activity", "photo-contest")
- Display name ("Daily Activity Tracker", "Photo Contest")
- Description (shown to users when creating tournaments)
- Submission schema definition (JSON schema or typed fields)
- Scoring configuration (formula, multipliers, bonuses)
- Validation rules (required fields, constraints)
- UI component mapping (which form/display components to use)

**Acceptance Criteria**:

- [ ] Admin can create new competition type via UI or Convex dashboard
- [ ] Competition type is stored in database with versioning
- [ ] Competition type can be edited (new version created)
- [ ] Tournament creation form shows available competition types
- [ ] Competition type change on existing tournament is blocked (data migration required)

#### FR2: Dynamic Submission Schema

**Requirement**: Submissions adapt to the competition type's schema.

**Use Cases**:

1. **Daily Activity**: `{ description?: string, tier: "base" | "advanced" }`
2. **Photo Contest**: `{ images: string[], caption: string, category: string }`
3. **Fitness Challenge**: `{ distance: number, duration: number, calories?: number, route?: GeoJSON }`
4. **Code Challenge**: `{ repositoryUrl: string, language: string, description: string }`
5. **Scavenger Hunt**: `{ items: string[], proofImages: string[], completedAt: string }`

**Acceptance Criteria**:

- [ ] Submission data is stored as flexible JSON field
- [ ] Schema validation happens on submission creation
- [ ] Form fields are generated based on competition type
- [ ] Display components render type-specific data correctly
- [ ] Existing submissions remain valid (backward compatibility)

#### FR3: Pluggable Scoring System

**Requirement**: Each competition type defines its own scoring method.

**Scoring Method Types**:

1. **Fixed Points** (current system)

   ```typescript
   { type: "fixed", points: { base: 1, advanced: 2 } }
   ```

2. **Formula-Based**

   ```typescript
   {
     type: "formula",
     expression: "distance * difficulty * 0.1",
     variables: ["distance", "difficulty"]
   }
   ```

3. **Ranked Scoring**

   ```typescript
   {
     type: "ranked",
     positions: [
       { rank: 1, points: 100 },
       { rank: 2, points: 80 },
       { rank: 3, points: 60 }
     ],
     defaultPoints: 10
   }
   ```

4. **Cumulative**

   ```typescript
   {
     type: "cumulative",
     metrics: ["distance", "calories", "duration"],
     weights: [1.0, 0.5, 0.2]
   }
   ```

5. **Custom Function** (advanced)

   ```typescript
   {
     type: "custom",
     functionName: "calculatePhotoScore", // Registered server-side function
     parameters: { ... }
   }
   ```

**Acceptance Criteria**:

- [ ] Scoring engine supports all scoring types
- [ ] Points are recalculated when scoring config changes
- [ ] Leaderboard updates correctly with new scoring
- [ ] Audit trail shows scoring version used
- [ ] Performance is acceptable (<100ms per calculation)

#### FR4: Type-Specific Validation

**Requirement**: Each competition type defines validation rules for submissions.

**Validation Rule Types**:

1. **Required Fields**

   ```typescript
   { field: "images", required: true, minItems: 1, maxItems: 5 }
   ```

2. **Numeric Constraints**

   ```typescript
   { field: "distance", min: 0, max: 100, unit: "km" }
   ```

3. **String Constraints**

   ```typescript
   { field: "description", minLength: 10, maxLength: 500 }
   ```

4. **Enum Constraints**

   ```typescript
   { field: "category", enum: ["landscape", "portrait", "macro"] }
   ```

5. **Custom Validators**

   ```typescript
   { validator: "validateGitHubRepo", errorMessage: "Invalid repository URL" }
   ```

**Acceptance Criteria**:

- [ ] Validation runs on submission creation/update
- [ ] Clear error messages shown to users
- [ ] Backend validation cannot be bypassed
- [ ] Frontend validation provides instant feedback
- [ ] Validation rules are versioned with competition type

#### FR5: Dynamic Form Generation

**Requirement**: Submission forms adapt to competition type schema.

**Form Field Mappings**:

| Schema Type | UI Component          | Configuration                           |
| ----------- | --------------------- | --------------------------------------- |
| `string`    | Text input / Textarea | `minLength`, `maxLength`, `placeholder` |
| `number`    | Number input          | `min`, `max`, `step`, `unit`            |
| `boolean`   | Checkbox / Toggle     | `label`, `helpText`                     |
| `enum`      | Select / Radio group  | `options`, `multiple`                   |
| `date`      | Date picker           | `minDate`, `maxDate`                    |
| `time`      | Time picker           | `format`                                |
| `image[]`   | Image uploader        | `maxFiles`, `maxSize`, `acceptedTypes`  |
| `location`  | Map picker            | `defaultCenter`, `zoom`                 |
| `url`       | URL input             | `urlPattern`, `allowedDomains`          |

**Acceptance Criteria**:

- [ ] Form fields are generated from competition type schema
- [ ] Validation works on all field types
- [ ] File uploads integrate with storage system
- [ ] Form state persists (user can save draft)
- [ ] Mobile-responsive for all field types

#### FR6: Type-Specific Display Components

**Requirement**: Submission cards/details adapt to competition type.

**Display Variants**:

1. **Daily Activity** (current):
   - Description text
   - Tier badge
   - Points display

2. **Photo Contest**:
   - Image gallery (grid/carousel)
   - Caption
   - Category badge
   - Like/vote count

3. **Fitness Challenge**:
   - Metrics dashboard (distance, time, calories)
   - Route map visualization
   - Personal bests indicator

4. **Code Challenge**:
   - Repository link
   - Language badge
   - Code preview/embed
   - Test results

**Acceptance Criteria**:

- [ ] Display components are registered per competition type
- [ ] Fallback to generic display if custom component unavailable
- [ ] Components handle missing/optional fields gracefully
- [ ] Real-time updates work across all display types
- [ ] Accessibility maintained for all variants

#### FR7: Competition Type Selection in Tournament Creation

**Requirement**: Admins select competition type when creating tournaments.

**Workflow**:

1. Admin navigates to "Create Tournament"
2. Select competition type from cards
3. Preview shows what submission form will look like
4. Configure competition-specific settings (scoring, validation)
5. Save tournament with embedded competition type config

**Acceptance Criteria**:

- [ ] Competition type cards shows all available types
- [ ] Description/preview helps admin understand type
- [ ] Cannot change type after tournament is created
- [ ] Scoring config is customizable per tournament
- [ ] Validation rules can be overridden (stricter only)

### Non-Functional Requirements

#### NFR1: Performance

- **Scoring Calculation**: <100ms per submission, <1s for full leaderboard recalculation
- **Form Rendering**: <200ms to generate dynamic form
- **Validation**: <50ms for client-side, <200ms for server-side
- **Schema Migration**: <5s for 10,000 existing submissions
- **Query Performance**: No degradation from current system (leverage Convex indexes)

#### NFR2: Backward Compatibility

- **Existing Data**: All current submissions must remain valid and scorable
- **Current UI**: Default competition type matches existing behavior exactly
- **API Stability**: Existing queries/mutations continue to work (with deprecation warnings)
- **Migration Path**: Zero-downtime deployment with gradual rollout

#### NFR3: Extensibility

- **New Types**: Adding a competition type requires only config, no code changes
- **Custom Scoring**: Support custom server-side functions for complex scoring
- **Plugin System**: Future support for third-party competition type plugins
- **Versioning**: Competition type schema supports versioning for evolution

#### NFR4: Security

- **Schema Injection**: Prevent malicious schema definitions (no code execution)
- **Validation Bypass**: Server-side validation cannot be circumvented
- **Role Enforcement**: Only admins can create competition types
- **Data Isolation**: Submissions cannot access data from other types

#### NFR5: Developer Experience

- **Type Safety**: Full TypeScript typing for all competition type definitions
- **Documentation**: Clear examples for each scoring method
- **Debugging**: Logging and error messages for scoring/validation failures
- **Testing**: Test utilities for creating mock competition types

---

## 4. Technical Design

### 4.1 Database Schema Changes

#### New Table: `competitionTypes`

```typescript
competitionTypes: defineTable({
  // Identity
  slug: v.string(), // "daily-activity", "photo-contest"
  name: v.string(), // "Daily Activity Tracker"
  description: v.string(), // Shown in tournament creation
  version: v.number(), // Schema versioning (starts at 1)

  // Status
  status: v.union(
    v.literal("active"), // Available for new tournaments
    v.literal("deprecated"), // No new tournaments, existing continue
    v.literal("archived"), // Hidden from UI
  ),

  // Submission Schema Definition
  submissionSchema: v.object({
    fields: v.array(
      v.object({
        name: v.string(), // "distance", "images", "description"
        type: v.union(
          v.literal("string"),
          v.literal("number"),
          v.literal("boolean"),
          v.literal("enum"),
          v.literal("date"),
          v.literal("time"),
          v.literal("images"), // Array of image URLs
          v.literal("location"), // GeoJSON
          v.literal("url"),
        ),
        label: v.string(), // Display label
        required: v.boolean(),
        defaultValue: v.optional(v.any()),

        // Type-specific constraints
        constraints: v.optional(
          v.object({
            min: v.optional(v.number()),
            max: v.optional(v.number()),
            minLength: v.optional(v.number()),
            maxLength: v.optional(v.number()),
            pattern: v.optional(v.string()), // Regex
            enum: v.optional(v.array(v.string())),
            minItems: v.optional(v.number()),
            maxItems: v.optional(v.number()),
            fileTypes: v.optional(v.array(v.string())), // ["image/jpeg", "image/png"]
            maxFileSize: v.optional(v.number()), // bytes
          }),
        ),

        // UI hints
        uiHints: v.optional(
          v.object({
            placeholder: v.optional(v.string()),
            helpText: v.optional(v.string()),
            displayOrder: v.optional(v.number()),
            displayVariant: v.optional(v.string()), // "textarea", "slider", etc.
          }),
        ),
      }),
    ),
  }),

  // Scoring Configuration
  scoringConfig: v.object({
    method: v.union(
      v.literal("fixed"),
      v.literal("formula"),
      v.literal("ranked"),
      v.literal("cumulative"),
      v.literal("custom"),
    ),
    config: v.any(), // Method-specific configuration (JSON)
  }),

  // Validation Rules
  validationRules: v.array(
    v.object({
      type: v.union(
        v.literal("required"),
        v.literal("numeric_range"),
        v.literal("string_length"),
        v.literal("enum_value"),
        v.literal("custom"),
      ),
      field: v.optional(v.string()), // Target field
      config: v.any(), // Rule-specific config
      errorMessage: v.string(),
    }),
  ),

  // Features
  features: v.object({
    supportsTeamSubmissions: v.boolean(),
    supportsIndividualSubmissions: v.boolean(),
    requiresApproval: v.boolean(),
    supportsRevisions: v.boolean(),
    supportsTiers: v.boolean(), // base/advanced
  }),

  // UI Component Mapping
  uiComponents: v.object({
    formComponent: v.optional(v.string()), // "DailyActivityForm", "PhotoContestForm"
    cardComponent: v.optional(v.string()), // "DailyActivityCard", "PhotoContestCard"
    detailComponent: v.optional(v.string()),
    leaderboardComponent: v.optional(v.string()),
  }),

  // Metadata
  createdBy: v.id("users"),
  createdAt: v.string(),
  updatedAt: v.string(),

  // Legacy support
  isBuiltIn: v.boolean(), // True for platform-provided types
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_slug_and_version", ["slug", "version"]);
```

#### Modified Table: `tournaments`

```typescript
tournaments: defineTable({
  // ... existing fields ...

  // NEW: Competition Type Reference
  competitionTypeId: v.id("competitionTypes"),
  competitionTypeSlug: v.string(), // Denormalized for queries
  competitionTypeVersion: v.number(), // Lock to specific version

  // NEW: Override scoring config (optional)
  scoringConfigOverride: v.optional(v.any()),

  // MODIFIED: Make optional (not all types use this)
  scoringConfig: v.optional(
    v.object({
      individualPoints: v.object({ base: v.number(), advanced: v.number() }),
      teamExercisePoints: v.object({ base: v.number(), advanced: v.number() }),
      teamExerciseThreshold: v.number(),
    }),
  ),

  // ... rest of fields ...
})
  .index("by_competition_type", ["competitionTypeId"])
  .index("by_competition_type_slug", ["competitionTypeSlug"]);
```

#### Modified Table: `submissions`

```typescript
submissions: defineTable({
  // ... existing fields ...

  // MODIFIED: Make optional (not all competition types use tiers)
  tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),

  // MODIFIED: Make optional (not all types differentiate individual/team)
  submissionType: v.optional(
    v.union(v.literal("individual"), v.literal("team")),
  ),

  // NEW: Flexible data field (JSON)
  data: v.any(), // Competition-type specific data

  // NEW: Metadata about scoring
  scoringMetadata: v.optional(
    v.object({
      scoringMethod: v.string(), // Which method was used
      calculatedAt: v.string(), // When points were calculated
      rawMetrics: v.optional(v.any()), // Input values for formula
      scoringVersion: v.optional(v.number()), // Competition type version
    }),
  ),

  // ... rest of fields ...
});
```

#### Migration Strategy

**Phase 1: Add New Fields (Non-Breaking)**

```typescript
// Add competitionTypes table
// Add optional fields to tournaments
// Add optional fields to submissions
// Deploy - old code still works
```

**Phase 2: Create Default Competition Type (Data Migration)**

```typescript
// Create "daily-activity" competition type matching current behavior
// Update all existing tournaments to reference this type
// Migrate submission data to new `data` field:
//   data: { description, tier, submissionType }
// Verify all existing submissions still calculate same points
```

**Phase 3: Update Code (Gradual)**

```typescript
// Update submission forms to use competition type schema
// Update scoring calculations to use new engine
// Update display components to handle different types
// Deploy with feature flag (enable per tournament)
```

**Phase 4: Cleanup (Final)**

```typescript
// Remove old scoring logic (deprecated functions)
// Remove feature flags
// Archive legacy schemas
```

### 4.2 Scoring Engine Architecture

#### Scoring Engine Interface

```typescript
// convex/scoring/engine.ts

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export interface ScoringContext {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  competitionType: Doc<"competitionTypes">;
  teamMembers: Doc<"teamMembers">[];
  allTeamSubmissions?: Doc<"submissions">[]; // For relative scoring
}

export interface ScoringResult {
  points: number;
  metadata: {
    method: string;
    calculatedAt: string;
    breakdown?: Record<string, number>; // For debugging/transparency
    rawMetrics?: Record<string, any>;
  };
}

export interface ScoringMethod {
  type: string;
  calculate(
    ctx: QueryCtx | MutationCtx,
    context: ScoringContext,
  ): Promise<ScoringResult>;
  validate(config: any): boolean;
}
```

#### Built-In Scoring Methods

```typescript
// convex/scoring/methods/fixed.ts

export const fixedPointsScoring: ScoringMethod = {
  type: "fixed",

  async calculate(ctx, { submission, tournament, competitionType }) {
    const config = tournament.scoringConfigOverride || competitionType.scoringConfig.config;

    // Support both old and new format
    if (submission.tier && submission.submissionType) {
      // Legacy daily activity scoring
      const isTeamExercise = /* calculate from submission group */;
      const points = isTeamExercise
        ? config.teamExercisePoints[submission.tier]
        : config.individualPoints[submission.tier];

      return {
        points,
        metadata: {
          method: "fixed",
          calculatedAt: new Date().toISOString(),
          breakdown: {
            tier: submission.tier,
            isTeamExercise,
            basePoints: points,
          },
        },
      };
    }

    // New format: flat points
    return {
      points: config.points || 1,
      metadata: {
        method: "fixed",
        calculatedAt: new Date().toISOString(),
      },
    };
  },

  validate(config) {
    return typeof config.points === "number" && config.points >= 0;
  },
};
```

```typescript
// convex/scoring/methods/formula.ts

import { create, all } from "mathjs";

const math = create(all);

export const formulaScoring: ScoringMethod = {
  type: "formula",

  async calculate(ctx, { submission }) {
    const { expression, variables } =
      submission.tournament.scoringConfig.config;

    // Extract values from submission.data
    const scope: Record<string, number> = {};
    for (const varName of variables) {
      scope[varName] = Number(submission.data[varName]) || 0;
    }

    try {
      const result = math.evaluate(expression, scope);

      return {
        points: Math.round(result * 100) / 100, // Round to 2 decimals
        metadata: {
          method: "formula",
          calculatedAt: new Date().toISOString(),
          rawMetrics: scope,
          breakdown: {
            expression,
            result,
          },
        },
      };
    } catch (error) {
      throw new Error(`Formula evaluation failed: ${error.message}`);
    }
  },

  validate(config) {
    if (!config.expression || !Array.isArray(config.variables)) {
      return false;
    }

    // Test compile formula
    try {
      math.parse(config.expression);
      return true;
    } catch {
      return false;
    }
  },
};
```

```typescript
// convex/scoring/methods/ranked.ts

export const rankedScoring: ScoringMethod = {
  type: "ranked",

  async calculate(ctx, { submission, tournament, allTeamSubmissions }) {
    const { positions, defaultPoints, sortBy, sortOrder } =
      tournament.scoringConfig.config;

    // Get all submissions for this date/tournament
    const sameDay = allTeamSubmissions.filter(
      (s) => s.date === submission.date,
    );

    // Sort by specified metric
    const sorted = sameDay.sort((a, b) => {
      const aVal = Number(a.data[sortBy]) || 0;
      const bVal = Number(b.data[sortBy]) || 0;
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    // Find rank
    const rank = sorted.findIndex((s) => s._id === submission._id) + 1;

    // Lookup points
    const rankConfig = positions.find((p) => p.rank === rank);
    const points = rankConfig?.points || defaultPoints;

    return {
      points,
      metadata: {
        method: "ranked",
        calculatedAt: new Date().toISOString(),
        breakdown: {
          rank,
          totalSubmissions: sorted.length,
          sortBy,
          sortOrder,
        },
      },
    };
  },

  validate(config) {
    return (
      Array.isArray(config.positions) &&
      typeof config.defaultPoints === "number" &&
      typeof config.sortBy === "string"
    );
  },
};
```

```typescript
// convex/scoring/methods/cumulative.ts

export const cumulativeScoring: ScoringMethod = {
  type: "cumulative",

  async calculate(ctx, { submission, tournament }) {
    const { metrics, weights } = tournament.scoringConfig.config;

    let totalPoints = 0;
    const breakdown: Record<string, number> = {};

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const weight = weights[i] || 1.0;
      const value = Number(submission.data[metric]) || 0;
      const contribution = value * weight;

      totalPoints += contribution;
      breakdown[metric] = contribution;
    }

    return {
      points: Math.round(totalPoints * 100) / 100,
      metadata: {
        method: "cumulative",
        calculatedAt: new Date().toISOString(),
        breakdown,
      },
    };
  },

  validate(config) {
    return (
      Array.isArray(config.metrics) &&
      Array.isArray(config.weights) &&
      config.metrics.length === config.weights.length
    );
  },
};
```

#### Scoring Engine Registry

```typescript
// convex/scoring/registry.ts

import { fixedPointsScoring } from "./methods/fixed";
import { formulaScoring } from "./methods/formula";
import { rankedScoring } from "./methods/ranked";
import { cumulativeScoring } from "./methods/cumulative";

const SCORING_METHODS = new Map<string, ScoringMethod>([
  ["fixed", fixedPointsScoring],
  ["formula", formulaScoring],
  ["ranked", rankedScoring],
  ["cumulative", cumulativeScoring],
]);

export function getScoringMethod(type: string): ScoringMethod {
  const method = SCORING_METHODS.get(type);
  if (!method) {
    throw new Error(`Unknown scoring method: ${type}`);
  }
  return method;
}

export function registerScoringMethod(method: ScoringMethod) {
  SCORING_METHODS.set(method.type, method);
}
```

#### Updated Scoring Calculation

```typescript
// convex/submissions.ts (modified)

import { getScoringMethod } from "./scoring/registry";

export async function recalculateSubmissionPoints(
  ctx: MutationCtx,
  args: { submissionId: Id<"submissions">; ... }
): Promise<number> {
  const submission = await ctx.db.get(args.submissionId);
  const [tournament, team] = await Promise.all([
    ctx.db.get(submission.tournamentId),
    ctx.db.get(submission.teamId),
  ]);

  // Get competition type
  const competitionType = await ctx.db.get(tournament.competitionTypeId);

  // Get scoring method
  const scoringMethod = getScoringMethod(competitionType.scoringConfig.method);

  // Prepare context
  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", q => q.eq("teamId", team._id))
    .collect();

  const allTeamSubmissions = await ctx.db
    .query("submissions")
    .withIndex("by_team", q => q.eq("teamId", team._id))
    .collect();

  const scoringContext = {
    submission,
    team,
    tournament,
    competitionType,
    teamMembers,
    allTeamSubmissions,
  };

  // Calculate points
  const result = await scoringMethod.calculate(ctx, scoringContext);

  // Update submission
  await ctx.db.patch(submission._id, {
    pointsEarned: result.points,
    scoringMetadata: result.metadata,
  });

  // Recalculate team points
  await recalculateTeamPoints(ctx, team._id);

  return result.points;
}
```

### 4.3 Dynamic Form Generation

#### Form Schema Parser

```typescript
// src/lib/competition-types/form-generator.ts

import { z } from "zod";
import type { Doc } from "../../../convex/_generated/dataModel";

export type FieldSchema =
  Doc<"competitionTypes">["submissionSchema"]["fields"][number];

export function generateZodSchema(fields: FieldSchema[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "string":
        fieldSchema = z.string();
        if (field.constraints?.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            field.constraints.minLength,
          );
        }
        if (field.constraints?.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            field.constraints.maxLength,
          );
        }
        if (field.constraints?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            new RegExp(field.constraints.pattern),
          );
        }
        break;

      case "number":
        fieldSchema = z.number();
        if (field.constraints?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.constraints.min);
        }
        if (field.constraints?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.constraints.max);
        }
        break;

      case "boolean":
        fieldSchema = z.boolean();
        break;

      case "enum":
        if (!field.constraints?.enum) {
          throw new Error(`Enum field ${field.name} missing enum values`);
        }
        fieldSchema = z.enum(field.constraints.enum as [string, ...string[]]);
        break;

      case "date":
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
        break;

      case "images":
        fieldSchema = z.array(z.string().url());
        if (field.constraints?.minItems) {
          fieldSchema = (fieldSchema as z.ZodArray<any>).min(
            field.constraints.minItems,
          );
        }
        if (field.constraints?.maxItems) {
          fieldSchema = (fieldSchema as z.ZodArray<any>).max(
            field.constraints.maxItems,
          );
        }
        break;

      case "url":
        fieldSchema = z.string().url();
        break;

      default:
        fieldSchema = z.any();
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.name] = fieldSchema;
  }

  return z.object(shape);
}
```

#### Dynamic Form Component

```typescript
// src/components/form/dynamic-competition-form.tsx

"use client";

import { useAppForm } from "@/hooks/form";
import { generateZodSchema, type FieldSchema } from "@/lib/competition-types/form-generator";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

interface DynamicCompetitionFormProps {
  fields: FieldSchema[];
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitting?: boolean;
}

export function DynamicCompetitionForm({
  fields,
  defaultValues = {},
  onSubmit,
  submitting = false,
}: DynamicCompetitionFormProps) {
  const schema = generateZodSchema(fields);

  const form = useAppForm({
    defaultValues,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  // Sort fields by display order
  const sortedFields = [...fields].sort(
    (a, b) => (a.uiHints?.displayOrder || 999) - (b.uiHints?.displayOrder || 999)
  );

  return (
    <form onSubmit={form.handleSubmit}>
      <FieldGroup>
        {sortedFields.map((field) => (
          <form.AppField key={field.name} name={field.name}>
            {(formField) => {
              // Render appropriate input based on field type
              switch (field.type) {
                case "string":
                  return field.uiHints?.displayVariant === "textarea" ? (
                    <formField.TextareaField
                      label={field.label}
                      placeholder={field.uiHints?.placeholder}
                      helpText={field.uiHints?.helpText}
                    />
                  ) : (
                    <formField.TextField
                      label={field.label}
                      placeholder={field.uiHints?.placeholder}
                      helpText={field.uiHints?.helpText}
                    />
                  );

                case "number":
                  return (
                    <formField.NumberField
                      label={field.label}
                      min={field.constraints?.min}
                      max={field.constraints?.max}
                      step={field.constraints?.step || 1}
                      helpText={field.uiHints?.helpText}
                    />
                  );

                case "boolean":
                  return (
                    <formField.CheckboxField
                      label={field.label}
                      helpText={field.uiHints?.helpText}
                    />
                  );

                case "enum":
                  return (
                    <formField.SelectField
                      label={field.label}
                      options={
                        field.constraints?.enum?.map((value) => ({
                          value,
                          label: value,
                        })) || []
                      }
                      helpText={field.uiHints?.helpText}
                    />
                  );

                case "date":
                  return (
                    <formField.DateField
                      label={field.label}
                      helpText={field.uiHints?.helpText}
                    />
                  );

                case "images":
                  return (
                    <formField.ImageUploadField
                      label={field.label}
                      maxFiles={field.constraints?.maxItems || 5}
                      maxSize={field.constraints?.maxFileSize}
                      acceptedTypes={field.constraints?.fileTypes}
                      helpText={field.uiHints?.helpText}
                    />
                  );

                case "url":
                  return (
                    <formField.URLField
                      label={field.label}
                      placeholder={field.uiHints?.placeholder || "https://"}
                      helpText={field.uiHints?.helpText}
                    />
                  );

                default:
                  return (
                    <formField.TextField
                      label={field.label}
                      helpText={field.uiHints?.helpText}
                    />
                  );
              }
            }}
          </form.AppField>
        ))}
      </FieldGroup>

      <Button type="submit" disabled={submitting || !form.state.canSubmit}>
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

#### Updated Submission Form

```typescript
// src/components/form/upsert-submission-form.tsx (refactored)

export function UpsertSubmissionFormDialog({ ... }: Props) {
  const { user } = useUser();
  const upsertSubmission = useMutation(api.submissions.upsert);

  // Fetch team's tournament to get competition type
  const team = useQuery(api.teams.get, selectedTeamId ? { teamId: selectedTeamId } : "skip");
  const tournament = useQuery(
    api.tournaments.get,
    team ? { tournamentId: team.tournamentId } : "skip"
  );
  const competitionType = useQuery(
    api.competitionTypes.get,
    tournament ? { id: tournament.competitionTypeId } : "skip"
  );

  if (!competitionType) {
    return <LoadingSpinner />;
  }

  const handleSubmit = async (data: Record<string, any>) => {
    await upsertSubmission({
      _id: submission?._id,
      teamId: selectedTeamId,
      date: selectedDate,
      data, // Competition-specific data
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit {competitionType.name}</DialogTitle>
          <DialogDescription>{competitionType.description}</DialogDescription>
        </DialogHeader>

        <DynamicCompetitionForm
          fields={competitionType.submissionSchema.fields}
          defaultValues={submission?.data || {}}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 4.4 Competition Type Registry & Built-In Types

#### Built-In Competition Types

```typescript
// convex/competitionTypes/builtins.ts

export const DAILY_ACTIVITY_TYPE = {
  slug: "daily-activity",
  name: "Daily Activity Tracker",
  description:
    "Track daily activities with base/advanced tiers and team activities bonuses",
  version: 1,
  status: "active" as const,
  isBuiltIn: true,

  submissionSchema: {
    fields: [
      {
        name: "description",
        type: "string" as const,
        label: "Description",
        required: false,
        constraints: {
          minLength: 0,
          maxLength: 500,
        },
        uiHints: {
          placeholder: "Describe the activity (optional)",
          displayOrder: 1,
          displayVariant: "textarea",
        },
      },
      {
        name: "tier",
        type: "enum" as const,
        label: "Tier",
        required: true,
        constraints: {
          enum: ["base", "advanced"],
        },
        uiHints: {
          displayOrder: 2,
        },
      },
      {
        name: "submissionType",
        type: "enum" as const,
        label: "Submission Type",
        required: true,
        constraints: {
          enum: ["individual", "team"],
        },
        uiHints: {
          displayOrder: 3,
        },
      },
    ],
  },

  scoringConfig: {
    method: "fixed" as const,
    config: {
      individualPoints: { base: 1, advanced: 2 },
      teamExercisePoints: { base: 3, advanced: 5 },
      teamExerciseThreshold: 0.5,
    },
  },

  validationRules: [
    {
      type: "required" as const,
      field: "tier",
      config: {},
      errorMessage: "Tier is required",
    },
    {
      type: "required" as const,
      field: "submissionType",
      config: {},
      errorMessage: "Submission type is required",
    },
  ],

  features: {
    supportsTeamSubmissions: true,
    supportsIndividualSubmissions: true,
    requiresApproval: true,
    supportsRevisions: false,
    supportsTiers: true,
    supportsTeamExercise: true,
  },

  uiComponents: {
    formComponent: "DailyActivityForm",
    cardComponent: "DailyActivityCard",
  },
};

export const PHOTO_CONTEST_TYPE = {
  slug: "photo-contest",
  name: "Photo Contest",
  description: "Submit photos in different categories with voting and likes",
  version: 1,
  status: "active" as const,
  isBuiltIn: true,

  submissionSchema: {
    fields: [
      {
        name: "images",
        type: "images" as const,
        label: "Photos",
        required: true,
        constraints: {
          minItems: 1,
          maxItems: 3,
          fileTypes: ["image/jpeg", "image/png", "image/webp"],
          maxFileSize: 5 * 1024 * 1024, // 5MB
        },
        uiHints: {
          displayOrder: 1,
          helpText: "Upload up to 3 photos (max 5MB each)",
        },
      },
      {
        name: "caption",
        type: "string" as const,
        label: "Caption",
        required: true,
        constraints: {
          minLength: 10,
          maxLength: 200,
        },
        uiHints: {
          displayOrder: 2,
          placeholder: "Describe your photo...",
        },
      },
      {
        name: "category",
        type: "enum" as const,
        label: "Category",
        required: true,
        constraints: {
          enum: ["landscape", "portrait", "macro", "action", "other"],
        },
        uiHints: {
          displayOrder: 3,
        },
      },
    ],
  },

  scoringConfig: {
    method: "ranked" as const,
    config: {
      sortBy: "likes", // Future: integrate voting system
      sortOrder: "desc",
      positions: [
        { rank: 1, points: 100 },
        { rank: 2, points: 80 },
        { rank: 3, points: 60 },
      ],
      defaultPoints: 10,
    },
  },

  validationRules: [
    {
      type: "required" as const,
      field: "images",
      config: { minItems: 1 },
      errorMessage: "At least one photo is required",
    },
  ],

  features: {
    supportsTeamSubmissions: false,
    supportsIndividualSubmissions: true,
    requiresApproval: true,
    supportsRevisions: false,
    supportsTiers: false,
    supportsTeamExercise: false,
  },

  uiComponents: {
    formComponent: "PhotoContestForm",
    cardComponent: "PhotoContestCard",
  },
};

export const FITNESS_CHALLENGE_TYPE = {
  slug: "fitness-challenge",
  name: "Fitness Challenge",
  description: "Track distance, duration, and calories for fitness activities",
  version: 1,
  status: "active" as const,
  isBuiltIn: true,

  submissionSchema: {
    fields: [
      {
        name: "distance",
        type: "number" as const,
        label: "Distance (km)",
        required: true,
        constraints: {
          min: 0,
          max: 500,
          step: 0.1,
        },
        uiHints: {
          displayOrder: 1,
        },
      },
      {
        name: "duration",
        type: "number" as const,
        label: "Duration (minutes)",
        required: true,
        constraints: {
          min: 0,
          max: 1440, // 24 hours
        },
        uiHints: {
          displayOrder: 2,
        },
      },
      {
        name: "calories",
        type: "number" as const,
        label: "Calories Burned",
        required: false,
        constraints: {
          min: 0,
          max: 10000,
        },
        uiHints: {
          displayOrder: 3,
        },
      },
      {
        name: "activityType",
        type: "enum" as const,
        label: "Activity Type",
        required: true,
        constraints: {
          enum: [
            "running",
            "cycling",
            "swimming",
            "walking",
            "hiking",
            "other",
          ],
        },
        uiHints: {
          displayOrder: 4,
        },
      },
    ],
  },

  scoringConfig: {
    method: "formula" as const,
    config: {
      expression: "distance * 10 + duration * 0.5 + (calories * 0.1)",
      variables: ["distance", "duration", "calories"],
    },
  },

  validationRules: [
    {
      type: "numeric_range" as const,
      field: "distance",
      config: { min: 0, max: 500 },
      errorMessage: "Distance must be between 0 and 500 km",
    },
  ],

  features: {
    supportsTeamSubmissions: true,
    supportsIndividualSubmissions: true,
    requiresApproval: false, // Auto-approve
    supportsRevisions: false,
    supportsTiers: false,
    supportsTeamExercise: false,
  },

  uiComponents: {
    formComponent: "FitnessChallengeForm",
    cardComponent: "FitnessChallengeCard",
  },
};
```

#### Initialization Function

```typescript
// convex/competitionTypes/init.ts

import { internalMutation } from "../_generated/server";
import {
  DAILY_ACTIVITY_TYPE,
  PHOTO_CONTEST_TYPE,
  FITNESS_CHALLENGE_TYPE,
} from "./builtins";

export const initializeBuiltInTypes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const builtInTypes = [
      DAILY_ACTIVITY_TYPE,
      PHOTO_CONTEST_TYPE,
      FITNESS_CHALLENGE_TYPE,
    ];

    for (const type of builtInTypes) {
      const existing = await ctx.db
        .query("competitionTypes")
        .withIndex("by_slug", (q) => q.eq("slug", type.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("competitionTypes", {
          ...type,
          createdBy: /* system user ID */,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  },
});
```

### 4.5 UI Integration Points

#### Tournament Creation Flow

```typescript
// src/app/(protected)/admin/tournaments/create/page.tsx

export default function CreateTournamentPage() {
  const [selectedCompetitionType, setSelectedCompetitionType] = useState<Id<"competitionTypes">>();

  const competitionTypes = useQuery(api.competitionTypes.list, { status: "active" });
  const competitionType = useQuery(
    api.competitionTypes.get,
    selectedCompetitionType ? { id: selectedCompetitionType } : "skip"
  );

  return (
    <div>
      <h1>Create Tournament</h1>

      {/* Step 1: Select Competition Type */}
      <div>
        <h2>Competition Type</h2>
        <div className="grid grid-cols-3 gap-4">
          {competitionTypes?.map((type) => (
            <Card
              key={type._id}
              onClick={() => setSelectedCompetitionType(type._id)}
              className={cn(
                "cursor-pointer transition-all",
                selectedCompetitionType === type._id && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <CardTitle>{type.name}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Step 2: Tournament Details */}
      {competitionType && (
        <TournamentDetailsForm
          competitionType={competitionType}
          onSubmit={handleCreateTournament}
        />
      )}
    </div>
  );
}
```

#### Submission Display Adaptation

```typescript
// src/components/submissions/display/submission-card.tsx (refactored)

export function SubmissionCard({ submission, ... }: SubmissionCardProps) {
  const tournament = useQuery(api.tournaments.get, { tournamentId: submission.tournamentId });
  const competitionType = useQuery(
    api.competitionTypes.get,
    tournament ? { id: tournament.competitionTypeId } : "skip"
  );

  if (!competitionType) {
    return <LoadingSpinner />;
  }

  // Use custom component if specified
  const CustomCard = getRegisteredComponent(competitionType.uiComponents.cardComponent);
  if (CustomCard) {
    return <CustomCard submission={submission} competitionType={competitionType} />;
  }

  // Fallback to generic display
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2">
          <Badge>{competitionType.name}</Badge>
          <Badge variant={submission.state}>{submission.state}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <GenericSubmissionDisplay
          data={submission.data}
          schema={competitionType.submissionSchema}
        />
      </CardContent>

      <CardFooter>
        <div className="text-muted-foreground text-sm">
          {submission.pointsEarned} points
        </div>
      </CardFooter>
    </Card>
  );
}
```

#### Component Registry

```typescript
// src/lib/competition-types/component-registry.ts

import type { ComponentType } from "react";

const COMPONENT_REGISTRY = new Map<string, ComponentType<any>>();

export function registerComponent(name: string, component: ComponentType<any>) {
  COMPONENT_REGISTRY.set(name, component);
}

export function getRegisteredComponent(
  name?: string,
): ComponentType<any> | null {
  if (!name) return null;
  return COMPONENT_REGISTRY.get(name) || null;
}

// Initialize with built-in components
import { DailyActivityCard } from "@/components/competitions/daily-activity/card";
import { PhotoContestCard } from "@/components/competitions/photo-contest/card";
import { FitnessChallengeCard } from "@/components/competitions/fitness-challenge/card";

registerComponent("DailyActivityCard", DailyActivityCard);
registerComponent("PhotoContestCard", PhotoContestCard);
registerComponent("FitnessChallengeCard", FitnessChallengeCard);
```

---

## 5. Implementation Plan

### Phase 1: Foundation (Week 1)

#### Day 1-2: Schema & Migration

**Tasks**:

1. Create `competitionTypes` table schema
2. Add optional fields to `tournaments` and `submissions`
3. Deploy schema migration (non-breaking)
4. Create built-in competition types (daily-activity, photo-contest, fitness-challenge)
5. Write data migration script:
   - Create default "daily-activity" competition type
   - Update all existing tournaments to reference it
   - Migrate submission `description`, `tier`, `submissionType` to `data` field
6. Test migration on staging data
7. Execute migration on production (during low-traffic window)

**Deliverables**:

- [ ] Schema deployed
- [ ] Migration script tested
- [ ] All existing data migrated successfully
- [ ] Backward compatibility verified

#### Day 3-4: Scoring Engine

**Tasks**:

1. Create scoring engine interface (`ScoringMethod`, `ScoringContext`, `ScoringResult`)
2. Implement built-in scoring methods:
   - Fixed points (backward-compatible with existing)
   - Formula-based (using mathjs)
   - Ranked scoring
   - Cumulative scoring
3. Create scoring registry
4. Write unit tests for each scoring method
5. Integrate scoring engine with `recalculateSubmissionPoints`
6. Verify existing submissions calculate same points (regression test)

**Deliverables**:

- [ ] Scoring engine functional
- [ ] All scoring methods implemented
- [ ] Unit tests passing
- [ ] Regression tests passing

#### Day 5: Form Generation

**Tasks**:

1. Create form schema parser (Zod schema generator)
2. Build `DynamicCompetitionForm` component
3. Create field type mapping (string → TextField, number → NumberField, etc.)
4. Add support for all field types (string, number, boolean, enum, date, images, url)
5. Test form generation with built-in competition types
6. Add form validation error handling

**Deliverables**:

- [ ] Dynamic form generator working
- [ ] All field types supported
- [ ] Validation working correctly

### Phase 2: Core Functionality (Week 2)

#### Day 1-2: Submission System Refactor

**Tasks**:

1. Refactor `submissions.upsert` mutation:
   - Accept `data: any` instead of hardcoded fields
   - Validate against competition type schema
   - Support both old and new formats (backward compatibility)
2. Update submission queries to include competition type data
3. Refactor approval/rejection logic:
   - Use competition type features (requiresApproval, supportsRevisions)
   - Maintain existing group submission logic for types that support it
4. Test submission flow end-to-end for each built-in competition type
5. Add error handling for schema validation failures

**Deliverables**:

- [ ] Submission mutations refactored
- [ ] Schema validation working
- [ ] All built-in types functional

#### Day 3: Tournament Creation Flow

**Tasks**:

1. Build competition type selector UI (card grid)
2. Create tournament details form with competition type context
3. Add scoring config customization UI
4. Implement tournament creation with competition type reference
5. Add preview of submission form before tournament creation
6. Test tournament creation for each competition type

**Deliverables**:

- [ ] Tournament creation UI complete
- [ ] Competition type selection working
- [ ] Preview functional

#### Day 4-5: Display Components

**Tasks**:

1. Create generic submission display component (renders `data` based on schema)
2. Build custom components for built-in types:
   - `DailyActivityCard` (existing, adapt)
   - `PhotoContestCard` (new)
   - `FitnessChallengeCard` (new)
3. Implement component registry
4. Update `SubmissionCard` to use competition type components
5. Update submission list, calendar, and detail views
6. Test display for all competition types

**Deliverables**:

- [ ] Generic display component
- [ ] All custom components built
- [ ] Component registry working
- [ ] UI updates complete

### Phase 3: Integration & Polish (Week 3)

#### Day 1-2: Admin Tools

**Tasks**:

1. Build competition type management UI:
   - List all competition types
   - Create custom competition type form
   - Edit existing types (create new version)
   - Archive/deprecate types
2. Add competition type preview (shows what submission form will look like)
3. Create competition type duplication feature (clone and modify)
4. Add validation for scoring config (test formulas, check enum values)
5. Build scoring method playground (test calculations)

**Deliverables**:

- [ ] Competition type admin UI complete
- [ ] Validation robust
- [ ] Preview functional

#### Day 3: Testing & Bug Fixes

**Tasks**:

1. Manual testing scenarios:
   - Create tournament with each built-in type
   - Submit entries for each type
   - Verify scoring calculations
   - Test approval workflows
   - Check leaderboard accuracy
2. Regression testing:
   - Verify existing daily-activity tournaments work exactly as before
   - Check migration data integrity
3. Performance testing:
   - Test with 1000+ submissions
   - Measure scoring calculation time
   - Optimize queries if needed
4. Fix identified bugs
5. Handle edge cases (missing fields, invalid data, schema changes)

**Deliverables**:

- [ ] All test scenarios passing
- [ ] Regression tests passing
- [ ] Performance acceptable
- [ ] Bugs fixed

#### Day 4: Documentation & Deployment

**Tasks**:

1. Update CLAUDE.md with competition type architecture
2. Write developer guide for creating new competition types
3. Document scoring methods with examples
4. Create user guide for admins (how to create tournaments with different types)
5. Add inline documentation (TSDoc) for all new functions
6. Prepare deployment plan:
   - Feature flag strategy
   - Rollback plan
   - Monitoring alerts
7. Deploy to staging
8. Final QA on staging
9. Deploy to production (gradual rollout if possible)

**Deliverables**:

- [ ] Documentation complete
- [ ] Deployment successful
- [ ] No critical issues

#### Day 5: Buffer & Future Planning

**Tasks**:

1. Address any post-deployment issues
2. Gather user feedback
3. Plan future competition types based on requests
4. Document technical debt and future improvements
5. Create roadmap for Phase 2 features (see Section 8)

**Deliverables**:

- [ ] System stable
- [ ] Feedback collected
- [ ] Future roadmap defined

---

## 6. Example Competition Types

### Example 1: Daily Activity Tracker (Current System)

```typescript
{
  slug: "daily-activity",
  name: "Daily Activity Tracker",
  description: "Track daily activities with tier bonuses and team exercises",

  submissionSchema: {
    fields: [
      {
        name: "description",
        type: "string",
        label: "Activity Description",
        required: false,
        uiHints: { displayVariant: "textarea" }
      },
      {
        name: "tier",
        type: "enum",
        label: "Difficulty",
        required: true,
        constraints: { enum: ["base", "advanced"] }
      },
      {
        name: "submissionType",
        type: "enum",
        label: "Type",
        required: true,
        constraints: { enum: ["individual", "team"] }
      }
    ]
  },

  scoringConfig: {
    method: "fixed",
    config: {
      individualPoints: { base: 1, advanced: 2 },
      teamExercisePoints: { base: 3, advanced: 5 },
      teamExerciseThreshold: 0.5
    }
  },

  features: {
    supportsTeamSubmissions: true,
    supportsIndividualSubmissions: true,
    requiresApproval: true,
    supportsTeamExercise: true
  }
}
```

**User Experience**:

- User selects team/individual
- User selects base/advanced tier
- User optionally adds description
- Admin approves submission
- Points calculated based on tier and team participation
- Existing behavior preserved exactly

### Example 2: Photo Contest

```typescript
{
  slug: "photo-contest",
  name: "Photography Competition",
  description: "Submit photos and compete for likes and votes",

  submissionSchema: {
    fields: [
      {
        name: "images",
        type: "images",
        label: "Photos",
        required: true,
        constraints: {
          minItems: 1,
          maxItems: 3,
          maxFileSize: 5242880, // 5MB
          fileTypes: ["image/jpeg", "image/png"]
        }
      },
      {
        name: "title",
        type: "string",
        label: "Photo Title",
        required: true,
        constraints: { minLength: 5, maxLength: 100 }
      },
      {
        name: "caption",
        type: "string",
        label: "Caption",
        required: true,
        constraints: { minLength: 20, maxLength: 500 }
      },
      {
        name: "category",
        type: "enum",
        label: "Category",
        required: true,
        constraints: {
          enum: ["landscape", "portrait", "wildlife", "street", "abstract"]
        }
      }
    ]
  },

  scoringConfig: {
    method: "ranked",
    config: {
      sortBy: "likes", // Requires voting system (future feature)
      sortOrder: "desc",
      positions: [
        { rank: 1, points: 100 },
        { rank: 2, points: 80 },
        { rank: 3, points: 60 },
        { rank: 4-10, points: 40 }
      ],
      defaultPoints: 10
    }
  },

  features: {
    supportsTeamSubmissions: false,
    supportsIndividualSubmissions: true,
    requiresApproval: true,
    supportsTiers: false,
    supportsTeamExercise: false
  }
}
```

**User Experience**:

- User uploads 1-3 photos
- User writes title and caption
- User selects category
- Admin approves submission (checks appropriateness)
- Users vote/like photos (future feature)
- Points calculated based on ranking
- Leaderboard shows top photos

### Example 3: Fitness Challenge

```typescript
{
  slug: "fitness-challenge",
  name: "30-Day Fitness Challenge",
  description: "Track distance, duration, and calories for various fitness activities",

  submissionSchema: {
    fields: [
      {
        name: "activityType",
        type: "enum",
        label: "Activity",
        required: true,
        constraints: {
          enum: ["running", "cycling", "swimming", "walking", "hiking", "gym"]
        }
      },
      {
        name: "distance",
        type: "number",
        label: "Distance (km)",
        required: true,
        constraints: { min: 0, max: 500, step: 0.1 }
      },
      {
        name: "duration",
        type: "number",
        label: "Duration (minutes)",
        required: true,
        constraints: { min: 0, max: 1440 }
      },
      {
        name: "calories",
        type: "number",
        label: "Calories Burned",
        required: false,
        constraints: { min: 0, max: 10000 }
      },
      {
        name: "notes",
        type: "string",
        label: "Notes",
        required: false,
        uiHints: { displayVariant: "textarea" }
      }
    ]
  },

  scoringConfig: {
    method: "formula",
    config: {
      expression: "(distance * 10) + (duration * 0.5) + ((calories || 0) * 0.01)",
      variables: ["distance", "duration", "calories"]
    }
  },

  features: {
    supportsTeamSubmissions: true,
    supportsIndividualSubmissions: true,
    requiresApproval: false, // Auto-approve (trust-based)
    supportsTiers: false,
    supportsTeamExercise: false
  }
}
```

**User Experience**:

- User selects activity type
- User enters distance, duration, calories
- User adds optional notes
- Submission auto-approved immediately
- Points calculated via formula (distance × 10 + duration × 0.5 + calories × 0.01)
- Leaderboard shows total accumulated points
- No manual approval needed

### Example 4: Code Challenge

```typescript
{
  slug: "code-challenge",
  name: "Coding Competition",
  description: "Solve coding challenges and submit your solutions",

  submissionSchema: {
    fields: [
      {
        name: "repositoryUrl",
        type: "url",
        label: "GitHub Repository",
        required: true,
        constraints: {
          pattern: "^https://github\\.com/.+$"
        },
        uiHints: {
          placeholder: "https://github.com/username/repo",
          helpText: "Link to your public GitHub repository"
        }
      },
      {
        name: "language",
        type: "enum",
        label: "Programming Language",
        required: true,
        constraints: {
          enum: ["JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++"]
        }
      },
      {
        name: "challengeId",
        type: "enum",
        label: "Challenge",
        required: true,
        constraints: {
          enum: ["challenge-1", "challenge-2", "challenge-3"] // Dynamic per tournament
        }
      },
      {
        name: "description",
        type: "string",
        label: "Approach Description",
        required: true,
        constraints: { minLength: 50, maxLength: 1000 },
        uiHints: {
          displayVariant: "textarea",
          helpText: "Explain your approach and any optimizations"
        }
      }
    ]
  },

  scoringConfig: {
    method: "custom",
    config: {
      functionName: "scoreCodeChallenge",
      // Custom function checks:
      // - Tests pass (40 points)
      // - Code quality (30 points)
      // - Performance (20 points)
      // - Documentation (10 points)
    }
  },

  features: {
    supportsTeamSubmissions: true,
    supportsIndividualSubmissions: true,
    requiresApproval: true, // Manual review of code quality
    supportsTiers: false,
    supportsTeamExercise: false
  }
}
```

**User Experience**:

- User selects challenge and language
- User pastes GitHub repository URL
- User writes description of approach
- Admin reviews code for quality, correctness, documentation
- Custom scoring function calculates points based on automated tests + manual review
- Leaderboard shows best solutions

---

## 7. Open Questions & Decisions

### Q1: Custom Scoring Function Safety

**Question**: How do we allow custom scoring functions without code injection risks?

**Options**:

1. **Registered Functions Only**: Admins select from pre-defined functions (safe, limited)
2. **Sandboxed JavaScript**: Use VM2 or isolated-vm to run custom JS (complex, risky)
3. **Formula Language**: Create a safe DSL for scoring (limits flexibility)
4. **External Webhook**: Call external API for scoring (latency, dependency)

**Recommendation**: Start with registered functions only. Add formula language for common patterns. Consider webhooks for advanced use cases.

**Decision Required**: Product/Engineering Team

**Impact**: Determines extensibility for custom competition types.

### Q2: Schema Versioning Strategy

**Question**: How do we handle competition type schema evolution without breaking existing submissions?

**Options**:

1. **Immutable Schemas**: Cannot edit, must create new version
2. **Backward-Compatible Changes Only**: Can add optional fields
3. **Migration Scripts**: Provide data transformation on schema update
4. **Submission-Level Version Lock**: Each submission references schema version

**Recommendation**: Option 4 (submission-level version lock) + option 2 (backward-compatible changes). When editing schema, create new version. Existing submissions use old schema, new submissions use new schema.

**Decision Required**: Engineering Team

**Impact**: Determines complexity of schema management.

### Q3: Image Storage Implementation

**Question**: Which storage solution for competition types that require image uploads?

**Options**:

1. **Convex File Storage**: Native, integrated, simple
2. **Cloudinary**: CDN, transformations, optimization
3. **AWS S3**: Scalable, industry standard, complex setup
4. **Vercel Blob**: Integrated with hosting, simple

**Recommendation**: Start with Convex File Storage (simplicity, consistency). Migrate to CDN (Cloudinary/Vercel Blob) later if needed for optimization.

**Decision Required**: Product/Engineering Team

**Impact**: Affects implementation timeline and cost.

### Q4: Auto-Approval vs Manual Review

**Question**: Should some competition types support auto-approval (no admin review needed)?

**Use Case**: Fitness challenges with GPS tracking, code challenges with automated tests.

**Options**:

1. **Always Require Approval**: Maintain quality control
2. **Competition Type Feature Flag**: `requiresApproval: boolean`
3. **Hybrid**: Auto-approve, but allow admin override/audit
4. **Reputation-Based**: Trusted users get auto-approved

**Recommendation**: Option 2 (feature flag) + option 3 (audit trail). Some competition types can be trust-based with ability to revert.

**Decision Required**: Product Team

**Impact**: Determines admin workload and user experience.

### Q5: Leaderboard Customization

**Question**: Should different competition types have different leaderboard displays?

**Examples**:

- Photo contest: Show photos in leaderboard
- Fitness challenge: Show total distance/time
- Code challenge: Show test pass rate

**Options**:

1. **Generic Leaderboard**: Just show team name + points
2. **Custom Components**: Competition type defines leaderboard component
3. **Configurable Columns**: Admin selects which fields to display
4. **Multiple Views**: Leaderboard + gallery + stats

**Recommendation**: Option 2 (custom components) for maximum flexibility. Fallback to generic leaderboard.

**Decision Required**: UX/Product Team

**Impact**: Determines UI complexity and development effort.

---

## 8. Success Metrics

### Implementation Quality

- [ ] All existing tournaments function exactly as before (regression test)
- [ ] Zero data loss during migration
- [ ] Zero downtime deployment
- [ ] All TypeScript types compile without errors
- [ ] All unit tests passing (>90% coverage for scoring engine)
- [ ] All integration tests passing

### Functional Completeness

- [ ] Built-in competition types (daily-activity, photo-contest, fitness-challenge) fully functional
- [ ] Admins can create tournaments with any competition type
- [ ] Submission forms dynamically generate based on schema
- [ ] Scoring calculations work for all scoring methods
- [ ] Display components adapt to competition type
- [ ] Leaderboards calculate correctly for all types

### Performance

- [ ] Submission creation <500ms (p95)
- [ ] Scoring calculation <100ms per submission (p95)
- [ ] Leaderboard recalculation <1s for 100 teams (p95)
- [ ] Form rendering <200ms (p95)
- [ ] No query performance degradation from baseline

### Developer Experience

- [ ] Complete TypeScript typing for all APIs
- [ ] Clear error messages for validation failures
- [ ] Documentation includes examples for each scoring method
- [ ] Easy to add new competition type (config-only, no code changes)

### User Experience

- [ ] Form fields are intuitive and well-labeled
- [ ] Validation errors are clear and actionable
- [ ] Submission flow is smooth (no confusing steps)
- [ ] Leaderboards update in real-time
- [ ] Mobile-responsive for all competition types

---

## 9. Future Enhancements (Post-Launch)

### Phase 2 Features (3-6 months)

1. **Voting/Liking System**
   - Users can vote on submissions (photo contests)
   - Like counts affect scoring (ranked scoring)
   - Anti-gaming measures (rate limiting, verification)

2. **GPS/Map Integration**
   - Location field type with map picker
   - Route visualization for fitness challenges
   - Geofencing for scavenger hunts

3. **Automated Validation**
   - External API integration (verify GitHub repos, validate GPS data)
   - Image analysis (detect inappropriate content)
   - Code testing (run unit tests on submission)

4. **Submission Revisions**
   - Allow editing after submission (before approval)
   - Version history
   - Diff view for reviewers

5. **Multi-Stage Approval**
   - Preliminary review → final review
   - Reviewer assignment and workload distribution
   - Approval quotas and SLAs

6. **Batch Operations**
   - Approve/reject multiple submissions at once
   - Bulk scoring recalculation
   - Export submissions to CSV/JSON

### Phase 3 Features (6-12 months)

7. **Competition Type Marketplace**
   - Third-party developers can create and share competition types
   - Template library for common patterns
   - Rating and reviews for types

8. **Advanced Scoring**
   - ML-based scoring (image quality, code complexity)
   - Peer review scoring (community voting)
   - Dynamic difficulty adjustment

9. **Real-Time Competitions**
   - Live leaderboard updates during events
   - Live streaming integration
   - Real-time notifications

10. **Mobile App Support**
    - Native forms for each competition type
    - Camera integration for photo uploads
    - Offline submission queue

---

## 10. Conclusion

This specification provides a comprehensive blueprint for transforming the Urban Legends platform from a single-purpose daily activity tracker into a flexible, multi-competition platform. The architecture prioritizes:

1. **Backward Compatibility**: Existing tournaments continue to work exactly as before
2. **Extensibility**: New competition types can be added via configuration
3. **Type Safety**: Full TypeScript coverage ensures reliability
4. **Performance**: Minimal overhead from abstraction layer
5. **Developer Experience**: Clear APIs, good documentation, easy testing

### Key Architectural Decisions

- **JSON-based submission data**: Flexible enough for any competition type
- **Pluggable scoring engine**: Easy to add new scoring methods
- **Dynamic form generation**: UI adapts automatically to schema
- **Component registry**: Custom UI for specific competition types
- **Version locking**: Schema changes don't break existing data

### Implementation Strategy

- **3-week timeline**: Foundation → Implementation → Integration
- **Zero-downtime migration**: Gradual rollout with feature flags
- **Comprehensive testing**: Unit, integration, regression, performance
- **Excellent documentation**: Developer guides, user guides, examples

### Next Steps

1. **Review this specification** with product, engineering, and UX teams
2. **Make decisions** on open questions (Q1-Q5)
3. **Approve implementation plan** and timeline
4. **Begin Phase 1** (schema migration and scoring engine)
5. **Set up monitoring** for performance and error tracking

The multi-competition type architecture will future-proof the Urban Legends platform, enabling it to support diverse event formats while maintaining the quality and reliability users expect.
