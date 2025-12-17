/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessRequests from "../accessRequests.js";
import type * as auth from "../auth.js";
import type * as blockedManagement from "../blockedManagement.js";
import type * as budgetAccess from "../budgetAccess.js";
import type * as budgetItems from "../budgetItems.js";
import type * as budgetSharedAccess from "../budgetSharedAccess.js";
import type * as config_onboardingConfig from "../config/onboardingConfig.js";
import type * as departments from "../departments.js";
import type * as govtProjects from "../govtProjects.js";
import type * as http from "../http.js";
import type * as inspections from "../inspections.js";
import type * as lib_checkBudgetAccess from "../lib/checkBudgetAccess.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as loginTrail from "../loginTrail.js";
import type * as media from "../media.js";
import type * as myFunctions from "../myFunctions.js";
import type * as obligations from "../obligations.js";
import type * as passwordReset from "../passwordReset.js";
import type * as passwordResetManagement from "../passwordResetManagement.js";
import type * as permissions from "../permissions.js";
import type * as projects from "../projects.js";
import type * as remarks from "../remarks.js";
import type * as schema_accessRequests from "../schema/accessRequests.js";
import type * as schema_audit from "../schema/audit.js";
import type * as schema_auth from "../schema/auth.js";
import type * as schema_budgetSharedAccess from "../schema/budgetSharedAccess.js";
import type * as schema_budgets from "../schema/budgets.js";
import type * as schema_departments from "../schema/departments.js";
import type * as schema_govtProjectBreakdowns from "../schema/govtProjectBreakdowns.js";
import type * as schema_inspections from "../schema/inspections.js";
import type * as schema_media from "../schema/media.js";
import type * as schema_misc from "../schema/misc.js";
import type * as schema_passwordReset from "../schema/passwordReset.js";
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
  accessRequests: typeof accessRequests;
  auth: typeof auth;
  blockedManagement: typeof blockedManagement;
  budgetAccess: typeof budgetAccess;
  budgetItems: typeof budgetItems;
  budgetSharedAccess: typeof budgetSharedAccess;
  "config/onboardingConfig": typeof config_onboardingConfig;
  departments: typeof departments;
  govtProjects: typeof govtProjects;
  http: typeof http;
  inspections: typeof inspections;
  "lib/checkBudgetAccess": typeof lib_checkBudgetAccess;
  "lib/rbac": typeof lib_rbac;
  loginTrail: typeof loginTrail;
  media: typeof media;
  myFunctions: typeof myFunctions;
  obligations: typeof obligations;
  passwordReset: typeof passwordReset;
  passwordResetManagement: typeof passwordResetManagement;
  permissions: typeof permissions;
  projects: typeof projects;
  remarks: typeof remarks;
  "schema/accessRequests": typeof schema_accessRequests;
  "schema/audit": typeof schema_audit;
  "schema/auth": typeof schema_auth;
  "schema/budgetSharedAccess": typeof schema_budgetSharedAccess;
  "schema/budgets": typeof schema_budgets;
  "schema/departments": typeof schema_departments;
  "schema/govtProjectBreakdowns": typeof schema_govtProjectBreakdowns;
  "schema/inspections": typeof schema_inspections;
  "schema/media": typeof schema_media;
  "schema/misc": typeof schema_misc;
  "schema/passwordReset": typeof schema_passwordReset;
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
