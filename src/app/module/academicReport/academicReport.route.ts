import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { AcademicReportController } from "./academicReport.controller";
import { AcademicReportValidation } from "./academicReport.validation";

const router = Router();
const reportRoles = [Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN];

router.post("/generate", auth(...reportRoles), validateRequest(AcademicReportValidation.GenerateAcademicReportSchema), AcademicReportController.generateAcademicReport);
router.get("/", auth(...reportRoles), AcademicReportController.getAcademicReports);
router.get("/:reportId", auth(...reportRoles), AcademicReportController.getAcademicReport);

export const AcademicReportRoutes = router;