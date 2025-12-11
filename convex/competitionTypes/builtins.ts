/**
 * Built-In Competition Types
 *
 * These are the default competition types provided by the platform.
 * They cover common use cases and serve as examples for custom types.
 */

export const DAILY_ACTIVITY_TYPE = {
  slug: "daily-activity",
  name: "Daily Activity Tracker",
  description:
    "Track daily activities with base/advanced tiers and team exercise bonuses. Maintains backward compatibility with existing tournaments.",
  version: 1,
  status: "active" as const,
  isBuiltIn: true,

  submissionSchema: {
    fields: [
      {
        name: "description",
        type: "string" as const,
        label: "Activity Description",
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
        label: "Difficulty Tier",
        required: true,
        constraints: {
          enum: ["base", "advanced"],
        },
        uiHints: {
          displayOrder: 2,
          helpText:
            "Base: Standard difficulty, Advanced: Challenging difficulty",
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
          helpText: "Individual: Solo activity, Team: Group activity",
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
      errorMessage: "Difficulty tier is required",
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
  },

  uiComponents: {
    formComponent: "DailyActivityForm",
    cardComponent: "DailyActivityCard",
  },
} as const;

export const PHOTO_CONTEST_TYPE = {
  slug: "photo-contest",
  name: "Photo Contest",
  description:
    "Submit photos in different categories with voting and ranking. Great for creative competitions.",
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
          helpText: "Upload 1-3 photos (max 5MB each, JPG/PNG/WebP formats)",
        },
      },
      {
        name: "title",
        type: "string" as const,
        label: "Photo Title",
        required: true,
        constraints: {
          minLength: 5,
          maxLength: 100,
        },
        uiHints: {
          displayOrder: 2,
          placeholder: "Give your photo a catchy title",
        },
      },
      {
        name: "caption",
        type: "string" as const,
        label: "Caption",
        required: true,
        constraints: {
          minLength: 20,
          maxLength: 500,
        },
        uiHints: {
          displayOrder: 3,
          placeholder: "Tell the story behind your photo...",
          displayVariant: "textarea",
        },
      },
      {
        name: "category",
        type: "enum" as const,
        label: "Category",
        required: true,
        constraints: {
          enum: ["landscape", "portrait", "wildlife", "street", "abstract"],
        },
        uiHints: {
          displayOrder: 4,
          helpText: "Select the category that best fits your photo",
        },
      },
    ],
  },

  scoringConfig: {
    method: "ranked" as const,
    config: {
      sortBy: "likes",
      sortOrder: "desc",
      positions: [
        { rank: 1, points: 100 },
        { rank: 2, points: 80 },
        { rank: 3, points: 60 },
        { rank: 4, points: 50 },
        { rank: 5, points: 40 },
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
    {
      type: "string_length" as const,
      field: "title",
      config: { minLength: 5, maxLength: 100 },
      errorMessage: "Title must be between 5 and 100 characters",
    },
    {
      type: "string_length" as const,
      field: "caption",
      config: { minLength: 20, maxLength: 500 },
      errorMessage: "Caption must be between 20 and 500 characters",
    },
  ],

  features: {
    supportsTeamSubmissions: false,
    supportsIndividualSubmissions: true,
    requiresApproval: true,
    supportsRevisions: false,
    supportsTiers: false,
  },

  uiComponents: {
    formComponent: "PhotoContestForm",
    cardComponent: "PhotoContestCard",
  },
} as const;

export const FITNESS_CHALLENGE_TYPE = {
  slug: "fitness-challenge",
  name: "Fitness Challenge",
  description:
    "Track distance, duration, and calories for various fitness activities. Formula-based scoring rewards effort.",
  version: 1,
  status: "active" as const,
  isBuiltIn: true,

  submissionSchema: {
    fields: [
      {
        name: "activityType",
        type: "enum" as const,
        label: "Activity Type",
        required: true,
        constraints: {
          enum: ["running", "cycling", "swimming", "walking", "hiking", "gym"],
        },
        uiHints: {
          displayOrder: 1,
          helpText: "Select your fitness activity",
        },
      },
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
          displayOrder: 2,
          helpText: "Distance covered in kilometers",
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
          step: 1,
        },
        uiHints: {
          displayOrder: 3,
          helpText: "How long did the activity take?",
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
          step: 1,
        },
        uiHints: {
          displayOrder: 4,
          helpText: "Optional: calories burned during activity",
        },
      },
      {
        name: "notes",
        type: "string" as const,
        label: "Notes",
        required: false,
        constraints: {
          maxLength: 500,
        },
        uiHints: {
          displayOrder: 5,
          placeholder: "Add any additional notes about your workout...",
          displayVariant: "textarea",
        },
      },
    ],
  },

  scoringConfig: {
    method: "formula" as const,
    config: {
      expression:
        "(distance * 10) + (duration * 0.5) + ((calories || 0) * 0.01)",
      variables: ["distance", "duration", "calories"],
    },
  },

  validationRules: [
    {
      type: "required" as const,
      field: "activityType",
      config: {},
      errorMessage: "Activity type is required",
    },
    {
      type: "numeric_range" as const,
      field: "distance",
      config: { min: 0, max: 500 },
      errorMessage: "Distance must be between 0 and 500 km",
    },
    {
      type: "numeric_range" as const,
      field: "duration",
      config: { min: 0, max: 1440 },
      errorMessage: "Duration must be between 0 and 1440 minutes (24 hours)",
    },
  ],

  features: {
    supportsTeamSubmissions: true,
    supportsIndividualSubmissions: true,
    requiresApproval: false, // Auto-approve
    supportsRevisions: false,
    supportsTiers: false,
  },

  uiComponents: {
    formComponent: "FitnessChallengeForm",
    cardComponent: "FitnessChallengeCard",
  },
} as const;

export const BUILTIN_COMPETITION_TYPES = [
  DAILY_ACTIVITY_TYPE,
  PHOTO_CONTEST_TYPE,
  FITNESS_CHALLENGE_TYPE,
] as const;
