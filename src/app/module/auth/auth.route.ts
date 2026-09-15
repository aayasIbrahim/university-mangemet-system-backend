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
router.post(
  "/login",
  validateRequest(UserValidation.LoginZodSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(
    Role.DEPARTMENT_ADMIN,
    Role.FINANCE_ADMIN,
    Role.INSTRUCTOR,
    Role.REGISTRAR,
    Role.STUDENT,
    Role.SUPER_ADMIN,
  ),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/forgot-password",
  validateRequest(UserValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);

export const AuthRoutes = router;
