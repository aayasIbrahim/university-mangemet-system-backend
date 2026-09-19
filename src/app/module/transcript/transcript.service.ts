import httpStatus from "http-status";
import {
  EnrollmentStatus,
  TranscriptStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

import { IQuery } from "../../interfaces";
import { transcriptInclude } from "./transcript.utlis";
import { TranscriptWhereInput } from "../../../generated/prisma/models";

const generateTranscript = async (studentId: string, semesterId: string) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, semesterId, status: EnrollmentStatus.COMPLETED },
    include: {
      course: { select: { id: true, code: true, title: true, credits: true } },
    },
    orderBy: { course: { code: "asc" } },
  });

  if (!enrollments.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No completed course enrollment found for this semester.",
    );
  }

  const existing = await prisma.transcript.findUnique({
    where: { studentId_semesterId: { studentId, semesterId } },
  });
  if (existing?.status === TranscriptStatus.PUBLISHED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Published transcript cannot be regenerated.",
    );
  }

  const attemptedCredits = enrollments.reduce(
    (sum, item) => sum + item.course.credits,
    0,
  );
  const earnedCredits = enrollments.reduce(
    (sum, item) =>
      sum +
      (item.finalGradePoint !== null && item.finalGradePoint >= 2
        ? item.course.credits
        : 0),
    0,
  );
  const totalQualityPoints = enrollments.reduce(
    (sum, item) => sum + (item.finalGradePoint ?? 0) * item.course.credits,
    0,
  );
  const sgpa = attemptedCredits ? totalQualityPoints / attemptedCredits : 0;

  const previousTranscripts = await prisma.transcript.findMany({
    where: {
      studentId,
      status: TranscriptStatus.PUBLISHED,
      NOT: { semesterId },
    },
    select: { attemptedCredits: true, totalQualityPoints: true },
  });
  const cumulativeCredits = previousTranscripts.reduce(
    (sum, item) => sum + Number(item.attemptedCredits),
    attemptedCredits,
  );
  const cumulativeQualityPoints = previousTranscripts.reduce(
    (sum, item) => sum + Number(item.totalQualityPoints),
    totalQualityPoints,
  );

  return prisma.$transaction(async (tx) => {
    const transcript = await tx.transcript.upsert({
      where: { studentId_semesterId: { studentId, semesterId } },
      create: {
        studentId,
        semesterId,
        status: TranscriptStatus.DRAFT,
        sgpa,
        cgpa: cumulativeCredits
          ? cumulativeQualityPoints / cumulativeCredits
          : 0,
        attemptedCredits,
        earnedCredits,
        totalQualityPoints,
        entries: {
          create: enrollments.map((item) => ({
            courseId: item.course.id,
            courseCode: item.course.code,
            courseTitle: item.course.title,
            credits: item.course.credits,
            letterGrade: item.finalLetterGrade,
            gradePoint: item.finalGradePoint,
            qualityPoints: (item.finalGradePoint ?? 0) * item.course.credits,
            isPassed:
              item.finalGradePoint !== null && item.finalGradePoint >= 2,
          })),
        },
      },
      update: {
        status: TranscriptStatus.DRAFT,
        sgpa,
        cgpa: cumulativeCredits
          ? cumulativeQualityPoints / cumulativeCredits
          : 0,
        attemptedCredits,
        earnedCredits,
        totalQualityPoints,
        issuedAt: null,
        publishedAt: null,
        entries: {
          deleteMany: {},
          create: enrollments.map((item) => ({
            courseId: item.course.id,
            courseCode: item.course.code,
            courseTitle: item.course.title,
            credits: item.course.credits,
            letterGrade: item.finalLetterGrade,
            gradePoint: item.finalGradePoint,
            qualityPoints: (item.finalGradePoint ?? 0) * item.course.credits,
            isPassed:
              item.finalGradePoint !== null && item.finalGradePoint >= 2,
          })),
        },
      },
      include: transcriptInclude,
    });
    return transcript;
  });
};

const getAllTranscript = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: TranscriptWhereInput[] = [];

  if (query.studentId) {
    andConditions.push({ studentId: query.studentId as string });
  }

  if (query.semesterId) {
    andConditions.push({ semesterId: query.semesterId as string });
  }

  if (query.status) {
    andConditions.push({ status: query.status as TranscriptStatus });

    if (query.searchTerm) {
      andConditions.push({
        student: {
          OR: [
            {
              studentIdNo: {
                contains: query.searchTerm.trim(),
                mode: "insensitive",
              },
            },
            {
              user: {
                firstName: {
                  contains: query.searchTerm.trim(),
                  mode: "insensitive",
                },
              },
            },
            {
              user: {
                lastName: {
                  contains: query.searchTerm.trim(),
                  mode: "insensitive",
                },
              },
            },
          ],
        },
      });
    }

    const whereConditions: TranscriptWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [transcripts, totalCount] = await Promise.all([
      prisma.transcript.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: transcriptInclude,
      }),
      prisma.transcript.count({ where: whereConditions }),
    ]);

    return {
      meta: {
        page,
        limit,
        total: totalCount,
        totalPage: Math.ceil(totalCount / limit),
      },
      data: transcripts,
    };
  }
};

const getSingleTranscript = async (transcriptId: string) => {
  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
    include: transcriptInclude,
  });
  if (!transcript)
    throw new AppError(httpStatus.NOT_FOUND, "Transcript not found.");
  return transcript;
};

const publishTranscript = async (transcriptId: string) => {
  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
    select: { id: true, status: true },
  });
  if (!transcript)
    throw new AppError(httpStatus.NOT_FOUND, "Transcript not found.");
  if (transcript.status === TranscriptStatus.PUBLISHED)
    return getSingleTranscript(transcriptId);

  return prisma.transcript.update({
    where: { id: transcriptId },
    data: {
      status: TranscriptStatus.PUBLISHED,
      issuedAt: new Date(),
      publishedAt: new Date(),
    },
    include: transcriptInclude,
  });
};
 const getMyTranscripts = async (userId: string, query: IQuery) => {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student)
    throw new AppError(httpStatus.NOT_FOUND, "Student profile not found.");
  return getAllTranscript({ ...query, studentId: student.id });
};
export const TranscriptService = {
  generateTranscript,
  getMyTranscripts,
  getAllTranscript,
  getSingleTranscript,
  publishTranscript,
};
