// convex/schema.ts

import { defineSchema } from "convex/server";
import { authTables } from "./schema/auth";
import { userTables } from "./schema/users";
import { projectTables } from "./schema/projects";
import { budgetTables } from "./schema/budgets";
import { inspectionTables } from "./schema/inspections";
import { mediaTables } from "./schema/media";
import { departmentTables } from "./schema/departments";
import { permissionTables } from "./schema/permissions";
import { auditTables } from "./schema/audit";
import { securityTables } from "./schema/security";
import { miscTables } from "./schema/misc";
import { accessRequestTables } from "./schema/accessRequests";
import { budgetSharedAccessTables } from "./schema/budgetSharedAccess";
import { passwordResetTables } from "./schema/passwordReset";
import { govtProjectBreakdownTables } from "./schema/govtProjectBreakdowns";

export default defineSchema({
  ...authTables,
  ...userTables,
  ...projectTables,
  ...budgetTables,
  ...inspectionTables,
  ...mediaTables,
  ...departmentTables,
  ...permissionTables,
  ...auditTables,
  ...securityTables,
  ...accessRequestTables,
  ...budgetSharedAccessTables,
  ...passwordResetTables,
  ...miscTables,
  ...govtProjectBreakdownTables, // <--- NEW REGISTRATION
});