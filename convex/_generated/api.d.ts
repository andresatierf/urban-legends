/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as authority_core from "../authority/core.js";
import type * as authority_index from "../authority/index.js";
import type * as captain from "../captain.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as data from "../data.js";
import type * as http from "../http.js";
import type * as joinRequests from "../joinRequests.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lifecycle_joinRequests from "../lifecycle/joinRequests.js";
import type * as lifecycle_submissions from "../lifecycle/submissions.js";
import type * as migrations from "../migrations.js";
import type * as notifications_triggers from "../notifications/triggers.js";
import type * as notifications_types from "../notifications/types.js";
import type * as notifications from "../notifications.js";
import type * as public_ from "../public.js";
import type * as role_admin from "../role/admin.js";
import type * as role_reviewer from "../role/reviewer.js";
import type * as role_tournamentManager from "../role/tournamentManager.js";
import type * as role_viewer from "../role/viewer.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as submissionGroups from "../submissionGroups.js";
import type * as submissions from "../submissions.js";
import type * as teamInvitations from "../teamInvitations.js";
import type * as teams from "../teams.js";
import type * as tournaments from "../tournaments.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "authority/core": typeof authority_core;
  "authority/index": typeof authority_index;
  captain: typeof captain;
  crons: typeof crons;
  dashboard: typeof dashboard;
  data: typeof data;
  http: typeof http;
  joinRequests: typeof joinRequests;
  "lib/dates": typeof lib_dates;
  "lib/helpers": typeof lib_helpers;
  "lifecycle/joinRequests": typeof lifecycle_joinRequests;
  "lifecycle/submissions": typeof lifecycle_submissions;
  migrations: typeof migrations;
  "notifications/triggers": typeof notifications_triggers;
  "notifications/types": typeof notifications_types;
  notifications: typeof notifications;
  public: typeof public_;
  "role/admin": typeof role_admin;
  "role/reviewer": typeof role_reviewer;
  "role/tournamentManager": typeof role_tournamentManager;
  "role/viewer": typeof role_viewer;
  roles: typeof roles;
  seed: typeof seed;
  submissionGroups: typeof submissionGroups;
  submissions: typeof submissions;
  teamInvitations: typeof teamInvitations;
  teams: typeof teams;
  tournaments: typeof tournaments;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
