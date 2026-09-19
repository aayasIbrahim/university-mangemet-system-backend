import { z } from "zod";
import { AcademicReportType } from "../../../generated/prisma/enums";

const GenerateAcademicReportSchema = z.object({
  semesterId: z.string().uuid("Semester ID must be a valid UUID"),
  type: z.nativeEnum(AcademicReportType),
  title: z.string().trim().min(3).max(200),
  departmentId: z.string().uuid("Department ID must be a valid UUID").optional(),
  programId: z.string().uuid("Program ID must be a valid UUID").optional(),
});

export const AcademicReportValidation = { GenerateAcademicReportSchema };