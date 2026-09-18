import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { ExamController } from "./exam.controller";
import { ExamValidation } from "./exam.validation";

const router = Router();

router.post(
  "/create-exam",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
  ),
  validateRequest(ExamValidation.CreateExamZodSchema),
  ExamController.createExam,
);

router.get(
  "/all-exam",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.STUDENT,
  ),
  ExamController.getAllExams,
);

router.get(
  "/:examId",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.STUDENT,
  ),
  ExamController.getSingleExam,
);

router.patch(
  "/:examId",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
  ),
  validateRequest(ExamValidation.UpdateExamZodSchema),
  ExamController.updateExam,
);

router.delete(
  "/:examId",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN),
  ExamController.deleteExam,
);

router.post(
  "/:examId/marks",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
  ),
  validateRequest(ExamValidation.SubmitExamMarksZodSchema),
  ExamController.submitExamMarks,
);

router.get(
  "/:examId/marks",
  auth(
    Role.SUPER_ADMIN,
    Role.REGISTRAR,
    Role.DEPARTMENT_ADMIN,
    Role.INSTRUCTOR,
    Role.STUDENT,
  ),
  ExamController.getExamMarks,
);

export const ExamRoutes = router;
