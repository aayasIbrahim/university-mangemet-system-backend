import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

import { EnrollmentStatus } from "../../../generated/prisma/enums";
import { IEnrollCoursePayload } from "./courseEnrollment.interface";
import { IQuery } from "../../interfaces";
import { CourseEnrollmentWhereInput } from "../../../generated/prisma/models";
import { calculateGradeAndPoint } from "./courseEnrollment.utils";

const enrollInCourse = async (payload: IEnrollCoursePayload) => {
  const { studentId, sectionId } = payload;
  try {
    return await prisma.$transaction(
      async (tx) => {
        const [student, targetSection] = await Promise.all([
          tx.studentProfile.findFirst({
            where: { id: studentId, isDeleted: false, status: "ACTIVE" },
            select: { id: true },
          }),
          tx.section.findFirst({
            where: { id: sectionId, isDeleted: false, isActive: true },
            select: {
              courseId: true,
              semesterId: true,
              capacity: true,
              sectionName: true,
            },
          }),
        ]);

        if (!student) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            "Active student profile not found.",
          );
        }

        if (!targetSection) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            "Target course section does not exist.",
          );
        }

        const { courseId, semesterId, capacity, sectionName } = targetSection;
        const existingEnrollment = await tx.courseEnrollment.findFirst({
          where: {
            studentId,
            semesterId,
            courseId,
            status: EnrollmentStatus.ENROLLED,
          },
          select: { id: true },
        });

        if (existingEnrollment) {
          throw new AppError(
            httpStatus.CONFLICT,
            `Student is already registered in this course for the current semester under section ${sectionName}.`,
          );
        }

        const currentEnrolledCount = await tx.courseEnrollment.count({
          where: { sectionId, status: EnrollmentStatus.ENROLLED },
        });

        if (currentEnrolledCount >= capacity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Section '${sectionName}' has reached its maximum capacity of ${capacity} students.`,
          )
        }

        return tx.courseEnrollment.create({
          data: { studentId, sectionId, semesterId, courseId },
          include: { course: true, section: true, student: true },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Student is already enrolled in this course section.",
      );
    }

    throw error;
  }
};


const updateEnrollmentMarks = async (enrollmentId: string, payload: any) => {
  const currentEnrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId }
  });

  if (!currentEnrollment) {
    throw new AppError(httpStatus.NOT_FOUND, "Enrollment record not found.");
  }

  const classTestsMark = payload.classTestsMark ?? currentEnrollment.classTestsMark;
  const midTermMark = payload.midTermMark ?? currentEnrollment.midTermMark;
  const finalExamMark = payload.finalExamMark ?? currentEnrollment.finalExamMark;
  const attendanceMark = payload.attendanceMark ?? currentEnrollment.attendanceMark;

  const totalMark = classTestsMark + midTermMark + finalExamMark + attendanceMark;

  const { finalGradePoint, finalLetterGrade } = calculateGradeAndPoint(totalMark);

  return await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      classTestsMark,
      midTermMark,
      finalExamMark,
      attendanceMark,
      totalMark,
      finalGradePoint,
      finalLetterGrade
    }
  });
};

const dropEnrolledCourse = async (enrollmentId: string) => {
  const isEnrollmentExist = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (
    !isEnrollmentExist ||
    isEnrollmentExist.status === EnrollmentStatus.DROPPED
  ) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Active course enrollment record not found.",
    );
  }

  if (isEnrollmentExist.finalGradePoint !== null) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Forbidden: Cannot drop a course after evaluation and grade allocation.",
    );
  }

  return await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.DROPPED,
    },
  });
};

const getMyEnrollments = async (studentId: string, query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: CourseEnrollmentWhereInput[] = [{ studentId }];

  if (query.semesterId) andConditions.push({ semesterId: query.semesterId });
  if (query.status)
    andConditions.push({ status: query.status as EnrollmentStatus });

  const whereConditions: CourseEnrollmentWhereInput = {
    AND: andConditions,
  };

  const [enrollments, total] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        course: { select: { title: true, code: true, credits: true } },
        section: { select: { sectionName: true, roomNumber: true } },
        semester: { select: { name: true, code: true, isCurrent: true } },
      },
    }),
    prisma.courseEnrollment.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: enrollments,
  };
};

export const CourseEnrollmentService = {
  enrollInCourse,
  updateEnrollmentMarks,
  dropEnrolledCourse,
  getMyEnrollments,
};
