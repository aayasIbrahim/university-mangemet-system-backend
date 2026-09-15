import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { validateRequest } from "../../middleware/validateReques";

const router = Router();

router.post(
  "/register",
  validateRequest(UserValidation.StudentRegistrationZodSchema),
  AuthController.registerStudent,
);
router.post(
  "/verify-email",
  validateRequest(UserValidation.StudentEmailVerifyZodSchema),
  AuthController.verifyStudentEmail,
);

export const AuthRoutes = router;
