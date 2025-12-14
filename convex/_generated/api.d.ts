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
import type * as blockedManagement from "../blockedManagement.js";
import type * as budgetItems from "../budgetItems.js";
import type * as departments from "../departments.js";
import type * as http from "../http.js";
import type * as inspections from "../inspections.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as loginTrail from "../loginTrail.js";
import type * as media from "../media.js";
import type * as myFunctions from "../myFunctions.js";
import type * as obligations from "../obligations.js";
import type * as permissions from "../permissions.js";
import type * as projects from "../projects.js";
import type * as remarks from "../remarks.js";
import type * as schema_audit from "../schema/audit.js";
import type * as schema_auth from "../schema/auth.js";
import type * as schema_budgets from "../schema/budgets.js";
import type * as schema_departments from "../schema/departments.js";
import type * as schema_inspections from "../schema/inspections.js";
import type * as schema_media from "../schema/media.js";
import type * as schema_misc from "../schema/misc.js";
import type * as schema_permissions from "../schema/permissions.js";
import type * as schema_projects from "../schema/projects.js";
import type * as schema_security from "../schema/security.js";
import type * as schema_users from "../schema/users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blockedManagement: typeof blockedManagement;
  budgetItems: typeof budgetItems;
  departments: typeof departments;
  http: typeof http;
  inspections: typeof inspections;
  "lib/rbac": typeof lib_rbac;
  loginTrail: typeof loginTrail;
  media: typeof media;
  myFunctions: typeof myFunctions;
  obligations: typeof obligations;
  permissions: typeof permissions;
  projects: typeof projects;
  remarks: typeof remarks;
  "schema/audit": typeof schema_audit;
  "schema/auth": typeof schema_auth;
  "schema/budgets": typeof schema_budgets;
  "schema/departments": typeof schema_departments;
  "schema/inspections": typeof schema_inspections;
  "schema/media": typeof schema_media;
  "schema/misc": typeof schema_misc;
  "schema/permissions": typeof schema_permissions;
  "schema/projects": typeof schema_projects;
  "schema/security": typeof schema_security;
  "schema/users": typeof schema_users;
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
