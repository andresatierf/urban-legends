import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../convex/_generated/api";

export type SystemHealth = FunctionReturnType<
  typeof api.role.admin.getSystemHealth
>;

export type SystemMetrics = SystemHealth["databaseMetrics"];
export type ServiceStatusMap = SystemHealth["services"];
