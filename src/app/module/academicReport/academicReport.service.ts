
import httpStatus from "http-status";
import {
  AcademicReportStatus,
  AcademicReportType,
  EnrollmentStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IGenerateAcademicReportPayload } from "./academicReport.interface";
import {  InputJsonValue } from "@prisma/client/runtime/client";
import { Prisma } from "../../../generated/prisma/client";

const reportInclude = {
  semester: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
  program: { select: { id: true, name: true, code: true } },
  generatedBy: { select: { id: true, firstName: true, lastName: true } },
};

const generateAcademicReport = async (
  generatedById: string,
  payload: IGenerateAcademicReportPayload,
) => {
  if (
    payload.type === AcademicReportType.DEPARTMENT_PERFORMANCE &&
    !payload.departmentId
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "departmentId is required for department performance reports.",
    );
  }
  if (
    payload.type === AcademicReportType.PROGRAM_PERFORMANCE &&
    !payload.programId
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "programId is required for program performance reports.",
    );
  }

  
  const initialReportRow = await prisma.academicReport.create({
    data: {
      semesterId: payload.semesterId,
      type: payload.type,
      title: payload.title.trim(),
      departmentId: payload.departmentId || null,
      programId: payload.programId || null,
      generatedById: generatedById,
      status: AcademicReportStatus.GENERATING,
      reportData: Prisma.JsonNull,
    },
  });

  try {
   
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        semesterId: payload.semesterId,
        status: EnrollmentStatus.COMPLETED,

        ...(payload.departmentId
          ? { course: { departmentId: payload.departmentId } }
          : {}),
        ...(payload.programId
          ? { course: { programId: payload.programId } }
          : {}),
      },
      select: {
        finalGradePoint: true,
        finalLetterGrade: true,
        course: { select: { code: true, title: true } },
      },
    });

   
    const graded = enrollments.filter((item) => item.finalGradePoint !== null);
    const passed = graded.filter(
      (item) => (Number(item.finalGradePoint) ?? 0) >= 2.0,
    ); 
//count how may get each grade
    const gradeDistribution = graded.reduce<Record<string, number>>(
      (distribution, item) => {
        const grade = item.finalLetterGrade ?? "NOT_GRADED";
        distribution[grade] = (distribution[grade] ?? 0) + 1;
        return distribution;
      },
      {},
    );

    const averageGpa = graded.length
      ? graded.reduce(
          (sum, item) => sum + (Number(item.finalGradePoint) ?? 0),
          0,
        ) / graded.length
      : 0;

    
    const reportData = {
      enrollmentCount: enrollments.length,
      gradedCount: graded.length,
      passedCount: passed.length,
      failedCount: graded.length - passed.length,
      passRate: graded.length
        ? Number(((passed.length / graded.length) * 100).toFixed(2))
        : 0,
      averageGpa: Number(averageGpa.toFixed(2)),
      gradeDistribution,
      generatedAt: new Date().toISOString(),
    };

    
    return await prisma.academicReport.update({
      where: { id: initialReportRow.id },
      data: {
        status: AcademicReportStatus.READY, 
        reportData: reportData as InputJsonValue,
        completedAt: new Date(),
        errorMessage: null, 
      },
      include: {
        semester: { select: { name: true, code: true } },
        generatedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  } catch (error: any) {
    
    await prisma.academicReport.update({
      where: { id: initialReportRow.id },
      data: {
        status: AcademicReportStatus.FAILED, // স্ট্যাটাস ফেইলড করে দেওয়া হলো
        errorMessage:
          error.message ||
          "An unexpected mathematical aggregation or constraint crash occurred during execution.",
        completedAt: new Date(),
      },
    });
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Report generation halted due to processing exception: ${error.message}`,
    );
  }
};
const getAcademicReports = async (semesterId?: string) =>
  prisma.academicReport.findMany({
    where: semesterId ? { semesterId } : undefined,
    include: reportInclude,
    orderBy: { generatedAt: "desc" },
  });

const getAcademicReport = async (reportId: string) => {
  const report = await prisma.academicReport.findUnique({
    where: { id: reportId },
    include: reportInclude,
  });
  if (!report)
    throw new AppError(httpStatus.NOT_FOUND, "Academic report not found.");
  return report;
};

export const AcademicReportService = {
  generateAcademicReport,
  getAcademicReports,
  getAcademicReport,
};
