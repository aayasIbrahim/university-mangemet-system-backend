import { Router } from "express";
import { UserController } from "./user.controllers";
import { upload } from "../../lib/multer";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { UserValidation } from "./user.validation";

const router = Router();

router.patch(
  "/profile",
  auth(
    Role.DEPARTMENT_ADMIN,
    Role.FINANCE_ADMIN,
    Role.INSTRUCTOR,
    Role.REGISTRAR,
    Role.STUDENT,
    Role.SUPER_ADMIN,
  ),
  validateRequest(UserValidation.UpdateProfileZodSchema),
  UserController.updateProfile,
);

router.patch(
  "/profile-image",
  auth(
    Role.DEPARTMENT_ADMIN,
    Role.FINANCE_ADMIN,
    Role.INSTRUCTOR,
    Role.REGISTRAR,
    Role.STUDENT,
    Role.SUPER_ADMIN,
  ),
  upload.single("profileImage"),
  UserController.uploadProfileImage,
);

export const UserRoutes = router;
