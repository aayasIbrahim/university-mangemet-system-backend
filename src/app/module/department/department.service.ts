import { Department } from "./../../../generated/prisma/browser";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import {
  ICreateDepartmentPayload,
  IUpdateDepartmentPayload,
} from "./department.interface";
import { AppError } from "../../utils/AppError";
import { DepartmentWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";

const createDepartment = async (
  payload: ICreateDepartmentPayload,
  user: RequestUser,
) => {
  const { name, code, description } = payload;
  const isDepartmentExist = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { equals: name.trim(), mode: "insensitive" } },
        { code: { equals: code.trim(), mode: "insensitive" } },
      ],
    },
  });

  if (isDepartmentExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Department with this name or code already exists.",
    );
  }
  const newDepartment = await prisma.department.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      admin: {
        connect: { id: user.userId },
      },
    },
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          imageUrl: true,
        },
      },
      programs: true,
    },
  });
  return newDepartment;
};
const getAllDepartments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: DepartmentWhereInput[] = [];

  //Searching
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: query.searchTerm, mode: "insensitive" } },
        { code: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  //filtering
  if (query.isActive !== undefined) {
    const isFieldActive =
      typeof query.isActive === "string"
        ? query.isActive === "true"
        : query.isActive;

    andConditions.push({ isActive: isFieldActive });
  }

  andConditions.push({ isDeleted: false });

  const allDepartment = await prisma.department.findMany({
    where: {
      AND: andConditions.length > 0 ? andConditions : undefined,
    },

    take: limit,
    skip: skip,

    orderBy: {
      // sortBy : sortOrder
      [sortBy]: sortOrder,
    },

    include: {
      admin: {
        omit: {
          password: true,
        },
      },

      programs: true,
    },
  });

  const totalDepartmentCount = await prisma.department.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: allDepartment,
    meta: {
      page: page,
      limit: limit,
      total: totalDepartmentCount,
      totalPages: Math.ceil(totalDepartmentCount / limit),
    },
  };
};
const getSingleDepartment = async (departmentId: string) => {
    
  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
    include: {
      programs: true,
    },
  });
  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
  }
  return department;
};
const updateDepartment = async (
  id: string,
  payload: IUpdateDepartmentPayload,
) => {
  const isDepartmentExist = await prisma.department.findUnique({
    where: { id },
  });

  if (!isDepartmentExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found to update!");
  }

  const { name, code, description, isActive } = payload;

  if (name || code) {
    const duplicateCheck = await prisma.department.findFirst({
      where: {
        NOT: { id },
        OR: [
          ...(name
            ? [{ name: { equals: name.trim(), mode: "insensitive" as const } }]
            : []),
          ...(code
            ? [{ code: { equals: code.trim(), mode: "insensitive" as const } }]
            : []),
        ],
      },
    });

    if (duplicateCheck) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Another department with this name or code already exists.",
      );
    }
  }

  const updatedDepartment = await prisma.department.update({
    where: { id },
    data: {
      name: name?.trim(),
      code: code?.trim().toUpperCase(),
      description:
        description !== undefined ? description?.trim() || null : undefined,
      isActive,
    },
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      programs: true,
    },
  });

  return updatedDepartment;
};
const deleteDepartment = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
  });

  if (!department || department.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Department not found or already deleted!",
    );
  }

  const result = await prisma.department.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return result;
};
const getDepartmentPrograms = async (departmentId: string) => {
  const existingDepartment = await prisma.department.findUnique({
    where: {
      id: departmentId,
      isDeleted: false,
    },
    include: {
      programs: true,
    },
  });

  if (!existingDepartment) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
  }

  return existingDepartment.programs;
};
export const DepartmentService = {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentPrograms,
};
