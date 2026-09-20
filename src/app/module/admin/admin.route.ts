import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();
const adminOnly = auth(Role.SUPER_ADMIN);

router.get(
  "/users",
  adminOnly,
  validateRequest(AdminValidation.listUsers),
  AdminController.getUsers,
);
router.patch(
  "/users/:id/role",
  adminOnly,
  validateRequest(AdminValidation.updateUserRole),
  AdminController.updateRole,
);
router.get("/dashboard-stats", adminOnly, AdminController.getDashboardStats);
router.get(
  "/audit-logs",
  adminOnly,
  validateRequest(AdminValidation.listAuditLogs),
  AdminController.getAuditLogs,
);

export const AdminRoutes = router;
