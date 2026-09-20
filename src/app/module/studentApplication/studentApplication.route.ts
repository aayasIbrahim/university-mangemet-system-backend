import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { upload } from "../../lib/multer";
import { validateRequest } from "../../middleware/validateReques";
import { StudentApplicationController } from "./studentApplication.controller";
import { StudentApplicationValidation } from "./studentApplication.validation";

const router = Router();
const reviewers = [Role.REGISTRAR, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN];

router.post(
  "/apply",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "additionalFiles", maxCount: 10 },
  ]),
  validateRequest(StudentApplicationValidation.apply),
  StudentApplicationController.apply,
);
router.post(
  "/verify-email",
  validateRequest(StudentApplicationValidation.verifyEmail),
  StudentApplicationController.verifyEmail,
);
router.get("/", auth(...reviewers), StudentApplicationController.getAll);
router.post(
  "/approve",
  auth(...reviewers),
  validateRequest(StudentApplicationValidation.approve),
  StudentApplicationController.approve,
);
router.post(
  "/reject",
  auth(...reviewers),
  validateRequest(StudentApplicationValidation.reject),
  StudentApplicationController.reject,
);

export const StudentApplicationRoutes = router;
