// convex/schema.ts

import { defineSchema } from "convex/server";
import { authTables } from "./schema/auth";
import { userTables } from "./schema/users";
import { departmentTables } from "./schema/departments";
import { permissionTables } from "./schema/permissions";
import { budgetTables } from "./schema/budgets";
import { projectTables } from "./schema/projects";
import { mediaTables } from "./schema/media";
import { inspectionTables } from "./schema/inspections";
import { securityTables } from "./schema/security";
import { auditTables } from "./schema/audit";
import { miscTables } from "./schema/misc";

export default defineSchema({
  ...authTables,
  ...userTables,
  ...departmentTables,
  ...permissionTables,
  ...budgetTables,
  ...projectTables,
  ...mediaTables,
  ...inspectionTables,
  ...securityTables,
  ...auditTables,
  ...miscTables,
});