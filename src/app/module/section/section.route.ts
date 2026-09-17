import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { SectionController } from "./section.controller";
import { SectionValidation } from "./section.validation";

const router = Router();

router.post(
  "/create-section",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN),
  validateRequest(SectionValidation.CreateSectionZodSchema),
  SectionController.createSection,
);

router.get(
  "/all-sections",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.STUDENT,
  ),
  SectionController.getAllSections,
);

router.get(
  "/:sectionId",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.STUDENT,
  ),
  SectionController.getSingleSection,
);

router.patch(
  "/:sectionId",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN),
  validateRequest(SectionValidation.UpdateSectionZodSchema),
  SectionController.updateSection,
);

router.delete(
  "/:sectionId",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR),
  SectionController.deleteSection,
);

export const SectionRoutes = router;
