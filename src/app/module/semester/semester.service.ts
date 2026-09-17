import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  ICreateSemesterPayload,
  ISemesterUpdatePayload,
} from "./semester.interface";
import { SemesterWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";

const createSemester = async (payload: ICreateSemesterPayload) => {
  const { code, startDate, endDate, isCurrent = false, isActive = true, ...remainingData } = payload;
  const normalizedCode = code.trim().toUpperCase();
  const normalizedStartDate = new Date(startDate);
  const normalizedEndDate = new Date(endDate);

  if (normalizedStartDate >= normalizedEndDate) {
    throw new AppError(httpStatus.BAD_REQUEST, "Start date must be earlier than the end date.");
  }

  if (isCurrent && !isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "A current semester must be active.");
  }

  const isCodeExist = await prisma.semester.findFirst({
    where: {
      code: { equals: normalizedCode, mode: "insensitive" },
      isDeleted: false,
    },
  });

  if (isCodeExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Semester with code '${code.trim().toUpperCase()}' already exists.`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const overlappingSemester = await tx.semester.findFirst({
      where: {
        isDeleted: false,
        startDate: { lt: normalizedEndDate },
        endDate: { gt: normalizedStartDate },
      },
    });

    if (overlappingSemester) {
      throw new AppError(httpStatus.CONFLICT, "Semester dates overlap with an existing semester.");
    }

    // If the new semester is set to 'isCurrent: true', all other semesters must be set to false
    if (isCurrent) {
      await tx.semester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return await tx.semester.create({
      data: {
        ...remainingData,
        code: normalizedCode,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        isCurrent,
        isActive,
      },
    });
  });

  return result;
};

const getAllSemesters = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "code";
  const sortOrder = query.sortOrder || "asc";

  const andConditions: SemesterWhereInput[] = [{ isDeleted: false }];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: query.searchTerm.trim(), mode: "insensitive" } },
        { code: { contains: query.searchTerm.trim(), mode: "insensitive" } },
      ],
    });
  }
  const whereConditions: SemesterWhereInput = { AND: andConditions };
  const [semester, total] = await Promise.all([
    prisma.semester.findMany({
      where: whereConditions,
      skip,
      take: Number(limit),
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.semester.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: semester,
  };
};


const getSingleSemester = async (id: string) => {
  const result = await prisma.semester.findUnique({
    where: { id, isDeleted: false },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Target Semester not found.");
  }

  return result;
};

const updateSemester = async (id: string, payload: ISemesterUpdatePayload) => {
  const isSemesterExist = await prisma.semester.findUnique({
    where: { id, isDeleted: false },
  });

  if (!isSemesterExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target Semester not found to modify.",
    );
  }

  const { code, isCurrent, startDate, endDate, ...remainingData } = payload;

  const finalStartDate = startDate
    ? new Date(startDate)
    : new Date(isSemesterExist.startDate);
  const finalEndDate = endDate
    ? new Date(endDate)
    : new Date(isSemesterExist.endDate);

  if (finalStartDate >= finalEndDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Updated start date must be earlier than end date.",
    );
  }

  const finalIsCurrent = isCurrent ?? isSemesterExist.isCurrent;
  const finalIsActive = payload.isActive ?? isSemesterExist.isActive;

  if (finalIsCurrent && !finalIsActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "A current semester must be active.");
  }

  if (code) {
    const isCodeExist = await prisma.semester.findFirst({
      where: {
        id: { not: id },
        code: { equals: code.trim(), mode: "insensitive" },
        isDeleted: false,
      },
    });

    if (isCodeExist) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Another semester with code '${code.trim().toUpperCase()}' already exists.`,
      );
    }
  }

  return await prisma.$transaction(async (tx) => {
    const overlappingSemester = await tx.semester.findFirst({
      where: {
        id: { not: id },
        isDeleted: false,
        startDate: { lt: finalEndDate },
        endDate: { gt: finalStartDate },
      },
    });

    if (overlappingSemester) {
      throw new AppError(httpStatus.CONFLICT, "Semester dates overlap with an existing semester.");
    }

    if (isCurrent === true) {
      await tx.semester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return await tx.semester.update({
      where: { id },
      data: {
        code: code?.trim().toUpperCase(),
        startDate: startDate ? finalStartDate : undefined,
        endDate: endDate ? finalEndDate : undefined,
        isCurrent,
        ...remainingData,
      },
    });
  });
};

const deleteSemester = async (id: string) => {
  const isSemesterExist = await prisma.semester.findUnique({
    where: { id, isDeleted: false },
  });

  if (!isSemesterExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target Semester not found to delete.",
    );
  }

  if (isSemesterExist.isCurrent) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "The current semester cannot be deleted. Set another semester as current first.",
    );
  }

  const result = await prisma.semester.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return result;
};

export const SemesterService = {
  createSemester,
  getAllSemesters,
  getSingleSemester,
  updateSemester,
  deleteSemester,
};
