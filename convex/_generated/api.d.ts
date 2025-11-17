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
import type * as admin from "../admin.js";
import type * as data from "../data.js";
import type * as http from "../http.js";
import type * as joinRequests from "../joinRequests.js";
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
  admin: typeof admin;
  data: typeof data;
  http: typeof http;
  joinRequests: typeof joinRequests;
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
