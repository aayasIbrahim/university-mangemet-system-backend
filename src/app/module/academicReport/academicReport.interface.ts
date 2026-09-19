import type { AcademicReportType } from "../../../generated/prisma/enums";

export interface IGenerateAcademicReportPayload {
  semesterId: string;
  type: AcademicReportType;
  title: string;
  departmentId?: string;
  programId?: string;
}