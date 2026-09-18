import httpStatus from "http-status";
import { AttendanceStatus } from "../../../generated/prisma/enums";
import { AttendanceWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IQuery } from "../../interfaces";
import { AppError } from "../../utils/AppError";
import {
  IMarkAttendancePayload,
    IUpdateAttendancePayload,
} from "./attendance.interface";

const markSessionAttendance = async (
  classSessionId: string,
  submittedById: string,
  payload: IMarkAttendancePayload,
) => {
  const session = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Class session not found.");
  }

  if (session.status === "CANCELLED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Attendance cannot be marked for a cancelled class session.",
    );
  }

  const studentIds = payload.attendances.map((record) => record.studentId);
  const studentProfiles = await prisma.studentProfile.findMany({
    where: {
      id: { in: studentIds },
      isDeleted: false,
    },
    select: { id: true },
  });

  const validStudentIds = new Set(studentProfiles.map((student) => student.id));
  const invalidIds = studentIds.filter(
    (studentId) => !validStudentIds.has(studentId),
  );

  if (invalidIds.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid student IDs found in attendance payload: ${invalidIds.join(", ")}`,
    );
  }

  await Promise.all(
    payload.attendances.map(({ studentId, status, remarks }) =>
      prisma.attendance.upsert({
        where: {
          classSessionId_studentId: {
            classSessionId,
            studentId,
          },
        },
        update: {
          status,
          remarks: remarks?.trim() || null,
          submittedById,
        },
        create: {
          classSessionId,
          studentId,
          status,
          remarks: remarks?.trim() || null,
          submittedById,
        },
      }),
    ),
  );

  return prisma.attendance.findMany({
    where: { classSessionId },
    orderBy: { createdAt: "asc" },
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
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

const getSessionAttendance = async (classSessionId: string, query: IQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: AttendanceWhereInput[] = [{ classSessionId }];

  if (query.status) {
    andConditions.push({ status: query.status as AttendanceStatus });
  }

  const where: AttendanceWhereInput = { AND: andConditions };

  const [sessionAttendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder } as any,
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    sessionAttendance,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getStudentAttendance = async (studentId: string, query: IQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: AttendanceWhereInput[] = [{ studentId }];

  if (query.status) {
    andConditions.push({ status: query.status as AttendanceStatus });
  }

  const where: AttendanceWhereInput = { AND: andConditions };

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder } as any,
      include: {
        classSession: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            topic: true,
            status: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where }),
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

const updateAttendance = async (
  attendanceId: string,
  submittedById: string,
  payload: IUpdateAttendancePayload,
) => {
  const existingAttendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!existingAttendance) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance record not found.");
  }

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status: payload.status,
      remarks:
        payload.remarks !== undefined
          ? payload.remarks?.trim() || null
          : undefined,
      submittedById,
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
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

export const AttendanceService = {
  markSessionAttendance,
  getSessionAttendance,
    getStudentAttendance,
    updateAttendance,
};
