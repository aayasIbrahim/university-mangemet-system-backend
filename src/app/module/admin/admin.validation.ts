import { z } from "zod";

const listUsers = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  searchTerm: z.string().trim().max(120).optional(),
  role: z.string().optional(),
  status: z.string().optional(),
});

const updateUserRole = z.object({
  role: z.enum(["STUDENT", "INSTRUCTOR", "DEPARTMENT_ADMIN", "REGISTRAR", "FINANCE_ADMIN", "SUPER_ADMIN"]),
});

const listAuditLogs = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  entity: z.string().max(80).optional(),
  entityId: z.string().optional(),
});

export const AdminValidation = { listUsers, updateUserRole, listAuditLogs };