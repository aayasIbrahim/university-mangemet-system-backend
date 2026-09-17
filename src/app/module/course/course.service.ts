import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICoursePayload, IUpdateCoursePayload } from "./course.interface";
import { CourseWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";

const createCourse = async (payload: ICoursePayload) => {
  const { code, title, credits, type, departmentId, programId, prerequisites } =
    payload;

  const isCodeExist = await prisma.course.findFirst({
    where: {
      code: { equals: code.trim(), mode: "insensitive" },
      isDeleted: false,
    },
  });
  if (isCodeExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Course code '${code.trim().toUpperCase()}' already exists.`,
    );
  }

  const [isDeptExist, isProgramValid] = await Promise.all([
    prisma.department.findUnique({
      where: { id: departmentId, isDeleted: false },
    }),
    prisma.program.findFirst({
      where: {
        id: programId,
        departmentId: departmentId,
        isDeleted: false,
      },
    }),
  ]);
  if (!isDeptExist)
    throw new AppError(httpStatus.NOT_FOUND, "Target Department not found.");
  if (!isProgramValid)
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target Program not found or does not belong to this Department.",
    );

  const transactionResult = await prisma.$transaction(async (tx) => {
    const newCourse = await tx.course.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        credits,
        type,
        departmentId,
        programId,
      },
    });

    // Handle initial prerequisite assignments via secondary relational mapping table
    if (prerequisites && prerequisites.length > 0) {
      await tx.coursePrerequisite.createMany({
        data: prerequisites.map((prereqId) => ({
          courseId: newCourse.id,
          prerequisiteId: prereqId,
        })),
      });
    }

    return tx.course.findUnique({
      where: { id: newCourse.id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        program: { select: { id: true, name: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, code: true, title: true } },
          },
        },
      },
    });
  });

  return transactionResult;
};

const getAllCourses = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "code";
  const sortOrder = query.sortOrder || "asc";

  const andConditions: CourseWhereInput[] = [{ isDeleted: false }];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { code: { contains: query.searchTerm.trim(), mode: "insensitive" } },
        { title: { contains: query.searchTerm.trim(), mode: "insensitive" } },
      ],
    });
  }

  if (query.departmentId)
    andConditions.push({ departmentId: query.departmentId });
  if (query.programId) andConditions.push({ programId: query.programId });
  if (query.type) andConditions.push({ type: query.type as any });

  const whereConditions: CourseWhereInput = { AND: andConditions };

  const [courses, totalCount] = await Promise.all([
    prisma.course.findMany({
      where: whereConditions,
      take: limit,
      skip: skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        department: { select: { id: true, code: true } },
        program: { select: { id: true, code: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, code: true, title: true } },
          },
        },
      },
    }),
    prisma.course.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    data: courses,
  };
};

const getSingleCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
    include: {
      department: { select: { id: true, name: true, code: true } },
      program: { select: { id: true, name: true, code: true } },
      prerequisites: {
        include: {
          prerequisite: { select: { id: true, code: true, title: true } },
        },
      },
    },
  });

  if (!course) throw new AppError(httpStatus.NOT_FOUND, "Course not found.");
  return course;
};

const updateCourse = async (
  courseId: string,
  payload: IUpdateCoursePayload,
) => {
  const isCourseExist = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
    include: { prerequisites: true },
  });

  if (!isCourseExist)
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target course not found to modify.",
    );

  const { code, title, prerequisites, ...remainingData } = payload;

  if (code) {
    const duplicateCheck = await prisma.course.findFirst({
      where: {
        id: { not: courseId },
        code: { equals: code.trim(), mode: "insensitive" },
        isDeleted: false,
      },
    });
    if (duplicateCheck)
      throw new AppError(
        httpStatus.CONFLICT,
        "Another course with this code already exists.",
      );
  }

  return await prisma.$transaction(async (tx) => {
    if (prerequisites !== undefined) {
      if (prerequisites.includes(courseId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "A course cannot have itself listed as a prerequisite.",
        );
      }

      const existingPrereqIds = isCourseExist.prerequisites.map(
        (p) => p.prerequisiteId,
      );

      const toLink = prerequisites.filter(
        (pid) => !existingPrereqIds.includes(pid),
      );
      const toUnlink = existingPrereqIds.filter(
        (pid) => !prerequisites.includes(pid),
      );

      if (toUnlink.length > 0) {
        await tx.coursePrerequisite.deleteMany({
          where: { courseId, prerequisiteId: { in: toUnlink } },
        });
      }

      if (toLink.length > 0) {
        await tx.coursePrerequisite.createMany({
          data: toLink.map((pid) => ({ courseId, prerequisiteId: pid })),
        });
      }
    }

    return await tx.course.update({
      where: { id: courseId },
      data: {
        code: code?.trim().toUpperCase(),
        title: title?.trim(),
        ...remainingData,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        program: { select: { id: true, name: true, code: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, code: true, title: true } },
          },
        },
      },
    });
  });
};

const deleteCourse = async (courseId: string) => {
  const isCourseExist = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
  });
  if (!isCourseExist)
    throw new AppError(httpStatus.NOT_FOUND, "Target course does not exist.");

  return await prisma.course.update({
    where: { id: courseId },
    data: { isDeleted: true, deletedAt: new Date(), isActive: false },
  });
};

const getCoursePrerequisites = async (courseId: string) => {
  const isCourseExist = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
  });

  if (!isCourseExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Target course not found!");
  }

  const prerequisitesData = await prisma.coursePrerequisite.findMany({
    where: {
      courseId: courseId,
      prerequisite: {
        isDeleted: false,
      },
    },
    include: {
      prerequisite: {
        select: {
          id: true,
          code: true,
          title: true,
          credits: true,
          type: true,
          isActive: true,
        },
      },
    },
  });

  return prerequisitesData.map((item) => item.prerequisite);
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getSingleCourse,
  updateCourse,
  deleteCourse,
  getCoursePrerequisites,
};
