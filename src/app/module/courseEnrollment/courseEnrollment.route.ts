import { Router } from "express";

import { validateRequest } from "../../middleware/validateReques";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { CourseEnrollmentController } from "./courseEnrollment.controller";
import { CourseEnrollmentValidation } from "./courseEnrollment.validation";

const router = Router();

router.post(
  "/enroll",
  auth(Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN, Role.STUDENT),
  // validateRequest(CourseEnrollmentValidation.EnrollInCourseZodSchema),

  CourseEnrollmentController.enrollInCourse,
);

router.patch(
  "/:enrollmentId/update-marks",
  auth(Role.INSTRUCTOR, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN),
  validateRequest(CourseEnrollmentValidation.UpdateEnrollmentMarksZodSchema),
  CourseEnrollmentController.updateEnrollmentMarks,
);

router.patch(
  "/:enrollmentId/drop",
  auth(Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN, Role.STUDENT),
  CourseEnrollmentController.dropEnrolledCourse,
);

router.get(
  "/my-enrollments",
  auth(Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.STUDENT),
  CourseEnrollmentController.getMyEnrollments,
);

router.get(
  "/my-courses",
  auth(Role.STUDENT),
  CourseEnrollmentController.getMyEnrollments,
);

export const CourseEnrollmentRoutes = router;
