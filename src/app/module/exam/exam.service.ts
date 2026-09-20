import httpStatus from "http-status";
import {
  ExamStatus,
  ExamType,
  EnrollmentStatus,
} from "../../../generated/prisma/enums";
import { ExamWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IQuery } from "../../interfaces";
import { AppError } from "../../utils/AppError";
import {
  ICreateExamPayload,
  IExamMarkPayload,
  ISubmitExamMarksPayload,
  IUpdateExamPayload,
} from "./exam.interface";

const createExam = async (payload: ICreateExamPayload) => {
  const section = await prisma.section.findUnique({
    where: { id: payload.sectionId },
    select: { id: true, courseId: true, semesterId: true },
  });

  if (!section) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Section not found for this exam.",
    );
  }

  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: payload.instructorId },
    select: { id: true, departmentId: true },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, "Instructor not found.");
  }

  const examDate = new Date(payload.examDate);
  if (Number.isNaN(examDate.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, "Exam date is invalid.");
  }

  return prisma.exam.create({
    data: {
      title: payload.title.trim(),
      type: payload.type,
      status: payload.status ?? ExamStatus.SCHEDULED,
      totalMarks: Number(payload.totalMarks),
      weightage: Number(payload.weightage),
      examDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      roomNumber: payload.roomNumber?.trim() || null,
      sectionId: payload.sectionId,
      instructorId: payload.instructorId,
    },
    include: {
      section: {
        select: {
          id: true,
          sectionName: true,
          course: { select: { id: true, code: true, title: true } },
        },
      },
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
};

const getAllExams = async (query: IQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "examDate";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: ExamWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      title: {
        contains: String(query.searchTerm).trim(),
        mode: "insensitive",
      },
    });
  }

  if (query.sectionId) {
    andConditions.push({ sectionId: String(query.sectionId) });
  }

  if (query.type) {
    andConditions.push({ type: query.type as ExamType });
  }

  if (query.status) {
    andConditions.push({ status: query.status as ExamStatus });
  }

  const where: ExamWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      skip,
      take: limit,
        orderBy: { [sortBy]: sortOrder },
      include: {
        section: {
          select: {
            id: true,
            sectionName: true,
            course: { select: { code: true, title: true } },
          },
        },
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.exam.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleExam = async (examId: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      section: {
        select: {
          id: true,
          sectionName: true,
          course: { select: { id: true, code: true, title: true } },
        },
      },
      instructor: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      marks: {
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new AppError(httpStatus.NOT_FOUND, "Exam not found.");
  }

  return exam;
};

const updateExam = async (examId: string, payload: IUpdateExamPayload) => {
  const existingExam = await prisma.exam.findUnique({ where: { id: examId } });

  if (!existingExam) {
    throw new AppError(httpStatus.NOT_FOUND, "Exam not found to update.");
  }

  const examDate = payload.examDate ? new Date(payload.examDate) : undefined;
  if (examDate && Number.isNaN(examDate.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, "Exam date is invalid.");
  }

  return prisma.exam.update({
    where: { id: examId },
    data: {
      title: payload.title?.trim(),
      type: payload.type,
      status: payload.status,
      totalMarks: payload.totalMarks,
      weightage: payload.weightage,
      examDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      roomNumber:
        payload.roomNumber !== undefined
          ? payload.roomNumber?.trim() || null
          : undefined,
      sectionId: payload.sectionId,
      instructorId: payload.instructorId,
    },
    include: {
      section: { select: { id: true, sectionName: true } },
      instructor: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });
};

const deleteExam = async (examId: string) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });

  if (!exam) {
    throw new AppError(httpStatus.NOT_FOUND, "Exam not found to delete.");
  }

  await prisma.exam.delete({ where: { id: examId } });

  return null;
};

const submitExamMarks = async (
  examId: string,
  instructorId: string,
  payload: ISubmitExamMarksPayload,
) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { id: true, sectionId: true, status: true },
  });

  if (!exam) {
    throw new AppError(httpStatus.NOT_FOUND, "Exam not found.");
  }

  if (exam.status === ExamStatus.PUBLISHED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Published exams cannot be modified.",
    );
  }

  const results = await Promise.all(
    payload.marks.map(async (record: IExamMarkPayload) => {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          sectionId: exam.sectionId,
          studentId: record.studentId,
          status: EnrollmentStatus.ENROLLED,
        },
        select: { id: true },
      });

      if (!enrollment) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Student ${record.studentId} is not enrolled in this exam section.`,
        );
      }

      return prisma.examMark.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: record.studentId,
          },
        },
        update: {
          obtainedMarks: record.obtainedMarks,
          isAbsent: record.isAbsent ?? false,
          remarks: record.remarks?.trim() || null,
          submittedById: instructorId,
        },
        create: {
          examId,
          studentId: record.studentId,
          obtainedMarks: record.obtainedMarks,
          isAbsent: record.isAbsent ?? false,
          remarks: record.remarks?.trim() || null,
          submittedById: instructorId,
        },
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    }),
  );

  return results;
};

const getExamMarks = async (examId: string) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });

  if (!exam) {
    throw new AppError(httpStatus.NOT_FOUND, "Exam not found.");
  }

  return prisma.examMark.findMany({
    where: { examId },
    include: {
      student: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      submittedBy: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

export const ExamService = {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam,
  submitExamMarks,
  getExamMarks,
};
