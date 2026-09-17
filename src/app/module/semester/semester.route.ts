
import { SemesterController } from "./semester.controller";
import { SemesterValidation } from "./semester.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateReques";
import { Router } from "express";

const router = Router();

router.post(
  "/create-semester",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR),
  validateRequest(SemesterValidation.CreateSemesterZodSchema),
  SemesterController.createSemester,
);

router.get(
  "/all-semesters",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
    Role.STUDENT,
  ),
  SemesterController.getAllSemesters,
);

router.get(
  "/:semesterId",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
    Role.STUDENT,
  ),
  SemesterController.getSingleSemester,
);

router.patch(
  "/:semesterId",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR),
  validateRequest(SemesterValidation.UpdateSemesterZodSchema),
  SemesterController.updateSemester,
);

router.delete(
  "/:semesterId",
  auth(Role.SUPER_ADMIN),
  SemesterController.deleteSemester,
);

export const SemesterRoutes = router;