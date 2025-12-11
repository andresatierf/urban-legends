/**
 * Competition Types Initialization
 *
 * This module handles initialization and registration of built-in competition types.
 * Should be run on system startup or when adding new built-in types.
 */

import { internalMutation } from "../_generated/server";
import { BUILTIN_COMPETITION_TYPES } from "./builtins";

/**
 * Initialize built-in competition types in the database.
 * Creates types if they don't exist, skips if they already exist.
 * This is idempotent - safe to run multiple times.
 */
export const initializeBuiltInTypes = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Initializing built-in competition types...");

    // Get system user (first admin user) or use a placeholder
    const systemUser = await ctx.db.query("users").first();
    if (!systemUser) {
      console.warn(
        "No system user found. Cannot initialize competition types yet.",
      );
      return { initialized: 0, skipped: 0, error: "No system user found" };
    }

    let initialized = 0;
    let skipped = 0;

    for (const builtinType of BUILTIN_COMPETITION_TYPES) {
      // Check if this slug and version already exists
      const existing = await ctx.db
        .query("competitionTypes")
        .withIndex("by_slug_and_version", (q) =>
          q.eq("slug", builtinType.slug).eq("version", builtinType.version),
        )
        .first();

      if (existing) {
        console.log(
          `Competition type "${builtinType.slug}" v${builtinType.version} already exists, skipping...`,
        );
        skipped++;
        continue;
      }

      // Create the competition type (convert readonly to mutable arrays)
      await ctx.db.insert("competitionTypes", {
        slug: builtinType.slug,
        name: builtinType.name,
        description: builtinType.description,
        version: builtinType.version,
        status: builtinType.status,
        isBuiltIn: builtinType.isBuiltIn,
        submissionSchema: {
          fields: builtinType.submissionSchema.fields.map((field) => {
            // biome-ignore lint/suspicious/noExplicitAny: Need to build mutable field object dynamically
            const mutableField: any = {
              name: field.name,
              type: field.type,
              label: field.label,
              required: field.required,
            };
            if ("defaultValue" in field) {
              mutableField.defaultValue = field.defaultValue;
            }
            if (field.constraints) {
              // biome-ignore lint/suspicious/noExplicitAny: Need to build mutable constraints object dynamically
              const mutableConstraints: any = {};
              // biome-ignore lint/suspicious/noExplicitAny: Constraints union has different shapes
              const constraints: any = field.constraints;
              if (constraints.min !== undefined)
                mutableConstraints.min = constraints.min;
              if (constraints.max !== undefined)
                mutableConstraints.max = constraints.max;
              if (constraints.minLength !== undefined)
                mutableConstraints.minLength = constraints.minLength;
              if (constraints.maxLength !== undefined)
                mutableConstraints.maxLength = constraints.maxLength;
              if (constraints.pattern !== undefined)
                mutableConstraints.pattern = constraints.pattern;
              if (constraints.enum !== undefined)
                mutableConstraints.enum = [...constraints.enum];
              if (constraints.minItems !== undefined)
                mutableConstraints.minItems = constraints.minItems;
              if (constraints.maxItems !== undefined)
                mutableConstraints.maxItems = constraints.maxItems;
              if (constraints.fileTypes !== undefined)
                mutableConstraints.fileTypes = [...constraints.fileTypes];
              if (constraints.maxFileSize !== undefined)
                mutableConstraints.maxFileSize = constraints.maxFileSize;
              if (constraints.step !== undefined)
                mutableConstraints.step = constraints.step;
              mutableField.constraints = mutableConstraints;
            }
            if (field.uiHints) {
              mutableField.uiHints = { ...field.uiHints };
            }
            return mutableField;
          }),
        },
        scoringConfig: builtinType.scoringConfig,
        validationRules: builtinType.validationRules.map((rule) => ({
          type: rule.type,
          field: rule.field,
          config: rule.config,
          errorMessage: rule.errorMessage,
        })),
        features: builtinType.features,
        uiComponents: builtinType.uiComponents,
        createdBy: systemUser._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(
        `Initialized competition type "${builtinType.name}" (${builtinType.slug} v${builtinType.version})`,
      );
      initialized++;
    }

    console.log(
      `Built-in competition types initialization complete: ${initialized} initialized, ${skipped} skipped`,
    );

    return { initialized, skipped };
  },
});
