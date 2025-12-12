/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as budgetItems from "../budgetItems.js";
import type * as http from "../http.js";
import type * as inspections from "../inspections.js";
import type * as media from "../media.js";
import type * as myFunctions from "../myFunctions.js";
import type * as projects from "../projects.js";
import type * as remarks from "../remarks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  budgetItems: typeof budgetItems;
  http: typeof http;
  inspections: typeof inspections;
  media: typeof media;
  myFunctions: typeof myFunctions;
  projects: typeof projects;
  remarks: typeof remarks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
