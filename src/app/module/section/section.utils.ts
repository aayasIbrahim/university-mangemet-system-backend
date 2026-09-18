import  httpStatus  from 'http-status';
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
export const sectionInclude = {
  course: { select: { id: true, code: true, title: true } },
  semester: { select: { id: true, name: true, code: true } },
};

export const validateCourseAndSemester = async (
  courseId: string,
  semesterId: string,
) => {
  const [course, semester] = await Promise.all([
    prisma.course.findFirst({
      where: { id: courseId, isActive: true, isDeleted: false },
    }),
    prisma.semester.findFirst({
      where: { id: semesterId, isActive: true, isDeleted: false },
    }),
  ]);

  if (!course) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target course not found or is inactive.",
    );
  }
  if (!semester) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target semester not found or is inactive.",
    );
  }
  if (course.semesterId !== semesterId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Section semester must match the course semester.",
    );
  }
};

export const ensureUniqueSection = async (
  courseId: string,
  semesterId: string,
  sectionName: string,
  sectionId?: string,
) => {
  const existingSection = await prisma.section.findFirst({
    where: {
      courseId,
      semesterId,
      sectionName: { equals: sectionName, mode: "insensitive" },
      ...(sectionId ? { id: { not: sectionId } } : {}),
    },
  });

  if (existingSection) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Section '${sectionName}' already exists for this course and semester.`,
    );
  }
};