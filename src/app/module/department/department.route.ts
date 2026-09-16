import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { DepartmentController } from "./department.controller";
import { DepartmentValidation } from "./department.validation";

const router = Router();

router.post(
  "/create-department",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR),
  validateRequest(DepartmentValidation.CreateDepartmentZodSchema),
  DepartmentController.createDepartment,
);

router.get("/all-department", DepartmentController.getAllDepartments);

router.get("/:departmentId", DepartmentController.getSingleDepartment);

router.patch(
  "/:departmentId",
  auth(Role.SUPER_ADMIN, Role.DEPARTMENT_ADMIN),
  validateRequest(DepartmentValidation.UpdateDepartmentZodSchema),
  DepartmentController.updateDepartment,
);

router.delete(
  "/:departmentId",
  auth(Role.SUPER_ADMIN),
  DepartmentController.deleteDepartment,
);

router.get("/:departmentId/programs", DepartmentController.getDepartmentPrograms);
export const DepartmentRoutes = router;
