import { ProgramWhereInput } from "../../../generated/prisma/internal/prismaNamespace";
import { IQuery } from "../../interfaces/index";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateProgramPayload,
  IUpdateProgramPayload,
} from "./program.interface";

const createProgram = async (payload: ICreateProgramPayload) => {
  const {
    name,
    departmentId,
    degree,
    durationYears,
    description,
    totalCredits,
    type,
  } = payload;

  const isDepartmentExist = await prisma.department.findFirst({
    where: { id: departmentId, isDeleted: false },
  });

  if (!isDepartmentExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target department does not exist or has been soft-deleted.",
    );
  }

  const isDuplicateProgram = await prisma.program.findFirst({
    where: {
      departmentId,
      name: { equals: name.trim(), mode: "insensitive" },
      isDeleted: false,
    },
  });

  if (isDuplicateProgram) {
    throw new AppError(
      httpStatus.CONFLICT,
      `A program named '${name.trim()}' already exists inside this department.`,
    );
  }

  return await prisma.program.create({
    data: {
      name: name.trim(),
      departmentId,
      degree: degree?.trim() || null,
      durationYears: durationYears || null,
      description: description?.trim() || null,
      totalCredits: totalCredits ?? 120,
      type,
      isActive: true,
    },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });
};
const getAllPrograms = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: ProgramWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: query.searchTerm.trim(), mode: "insensitive" } },
        { degree: { contains: query.searchTerm.trim(), mode: "insensitive" } },
      ],
    });
  }

  if (query.isActive !== undefined) {
    const isFieldActive =
      typeof query.isActive === "string"
        ? query.isActive === "true"
        : query.isActive;
    andConditions.push({ isActive: isFieldActive });
  }

  if (query.departmentId) {
    andConditions.push({ departmentId: query.departmentId });
  }

  andConditions.push({ isDeleted: false });
  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [programs, totalCount] = await Promise.all([
    prisma.program.findMany({
      where: whereConditions,
      take: limit,
      skip: skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    }),
    prisma.program.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    data: programs,
  };
};

const getSingleProgram = async (programId: string) => {
  const program = await prisma.program.findFirst({
    where: { id: programId, isDeleted: false },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!program) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "The requested academic program could not be found.",
    );
  }

  return program;
};

const updateProgram = async (
  programId: string,
  payload: IUpdateProgramPayload,
) => {
  const isProgramExist = await prisma.program.findFirst({
    where: { id: programId, isDeleted: false },
  });

  if (!isProgramExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target academic program not found to modify.",
    );
  }

  const { name, degree, durationYears, description, totalCredits, type } =
    payload;
  if (name) {
    const activeName = name ? name.trim() : isProgramExist.name;

    const duplicateCheck = await prisma.program.findFirst({
      where: {
        id: { not: programId },
        departmentId: isProgramExist.departmentId,
        name: { equals: activeName, mode: "insensitive" },
        isDeleted: false,
      },
    });

    if (duplicateCheck) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Another program with this name already exists in the department.",
      );
    }
  }

  return await prisma.program.update({
    where: { id: programId },
    data: {
      name: name?.trim(),
      degree: degree?.trim(),
      description:
        description !== undefined ? description?.trim() || null : undefined,
      totalCredits,
      type,
      durationYears,
      isActive: payload.isActive,
    },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });
};

const deleteProgram = async (id: string) => {
  const program = await prisma.program.findFirst({
    where: { id, isDeleted: false },
  });

  if (!program) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Target program does not exist or has already been soft-deleted.",
    );
  }

  return await prisma.program.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  });
};

export const ProgramService = {
  createProgram,
  getAllPrograms,
  getSingleProgram,
  updateProgram,
  deleteProgram,
};
