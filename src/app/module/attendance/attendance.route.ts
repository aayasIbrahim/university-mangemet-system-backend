import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { AttendanceController } from "./attendance.controller";
import { AttendanceValidation } from "./attendance.validation";

const router = Router();

router.post(
  "/session/:classSessionId/mark",
  auth(Role.INSTRUCTOR, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN),
  validateRequest(AttendanceValidation.MarkAttendanceZodSchema),
  AttendanceController.markSessionAttendance,
);

// router.get(
//   "/session/:classSessionId",
//   auth(
//     Role.SUPER_ADMIN,
//     Role.REGISTRAR,
//     Role.DEPARTMENT_ADMIN,
//     Role.INSTRUCTOR,
//     Role.STUDENT,
//   ),
//   AttendanceController.getSessionAttendance,
// );

// router.get(
//   "/student/:studentId",
//   auth(
//     Role.SUPER_ADMIN,
//     Role.REGISTRAR,
//     Role.DEPARTMENT_ADMIN,
//     Role.INSTRUCTOR,
//     Role.STUDENT,
//   ),
//   AttendanceController.getStudentAttendance,
// );

// router.patch(
//   "/:attendanceId",
//   auth(Role.INSTRUCTOR, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN),
//   validateRequest(AttendanceValidation.UpdateAttendanceZodSchema),
//   AttendanceController.updateAttendance,
// );

export const AttendanceRoutes = router;
