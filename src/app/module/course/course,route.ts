import { Router } from "express";
import { CourseController } from "./course.controller";

import { CourseValidation } from "./course.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateReques";

const router = Router();

router.post(
  "/create-course",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR),
  validateRequest(CourseValidation.CreateCourseZodSchema),
  CourseController.createCourse,
);

router.get("/all-course", CourseController.getAllCourses);

router.get("/:courseId", CourseController.getSingleCourse);

router.patch(
  "/:courseId",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN),
  validateRequest(CourseValidation.UpdateCourseZodSchema),
  CourseController.updateCourse,
);

router.delete(
  "/:courseId",
  auth(Role.SUPER_ADMIN),
  CourseController.deleteCourse,
);

router.get("/:courseId/prerequisites",auth(Role.SUPER_ADMIN, Role.DEPARTMENT_ADMIN, Role.STUDENT), CourseController.getCoursePrerequisites);

export const CourseRoutes = router;
