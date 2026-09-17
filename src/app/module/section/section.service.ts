import httpStatus from "http-status";
import { SectionWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IQuery } from "../../interfaces";
import { AppError } from "../../utils/AppError";
import {
  ICreateSectionPayload,
  IUpdateSectionPayload,
} from "./section.interface";

const sectionInclude = {
  course: { select: { id: true, code: true, title: true } },
  semester: { select: { id: true, name: true, code: true } },
};

const validateCourseAndSemester = async (
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

const ensureUniqueSection = async (
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

const createSection = async (payload: ICreateSectionPayload) => {
  const sectionName = payload.sectionName.trim().toUpperCase();
  await validateCourseAndSemester(payload.courseId, payload.semesterId);
  await ensureUniqueSection(payload.courseId, payload.semesterId, sectionName);

  return prisma.section.create({
    data: {
      sectionName,
      capacity: payload.capacity ?? 40,
      courseId: payload.courseId,
      semesterId: payload.semesterId,
      isActive: payload.isActive ?? true,
    },
    include: sectionInclude,
  });
};

const getAllSections = async (query: IQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const andConditions: SectionWhereInput[] = [{ isDeleted: false }];

  if (query.searchTerm) {
    andConditions.push({
      sectionName: {
        contains: String(query.searchTerm).trim(),
        mode: "insensitive",
      },
    });
  }
  if (query.courseId) andConditions.push({ courseId: String(query.courseId) });
  if (query.semesterId)
    andConditions.push({ semesterId: String(query.semesterId) });
  if (query.isActive !== undefined) {
    andConditions.push({ isActive: String(query.isActive) === "true" });
  }

  const where: SectionWhereInput = { AND: andConditions };
  const [data, total] = await Promise.all([
    prisma.section.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sectionName: query.sortOrder === "desc" ? "desc" : "asc" },
      include: sectionInclude,
    }),
    prisma.section.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getSingleSection = async (id: string) => {
  const section = await prisma.section.findFirst({
    where: { id, isDeleted: false },
    include: sectionInclude,
  });

  if (!section) throw new AppError(httpStatus.NOT_FOUND, "Section not found.");
  return section;
};

const updateSection = async (id: string, payload: IUpdateSectionPayload) => {
  const existingSection = await prisma.section.findFirst({
    where: { id, isDeleted: false },
  });

  if (!existingSection) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found to update.");
  }

  const courseId = payload.courseId ?? existingSection.courseId;
  const semesterId = payload.semesterId ?? existingSection.semesterId;
  const sectionName =
    payload.sectionName?.trim().toUpperCase() ?? existingSection.sectionName;

  await validateCourseAndSemester(courseId, semesterId);
  await ensureUniqueSection(courseId, semesterId, sectionName, id);

  return prisma.section.update({
    where: { id },
    data: {
      sectionName,
      capacity: payload.capacity,
      courseId,
      semesterId,
      isActive: payload.isActive,
    },
    include: sectionInclude,
  });
};

const deleteSection = async (id: string) => {
  const section = await prisma.section.findFirst({
    where: { id, isDeleted: false },
  });

  if (!section)
    throw new AppError(httpStatus.NOT_FOUND, "Section not found to delete.");

  return prisma.section.update({
    where: { id },
    data: { isDeleted: true, isActive: false, deletedAt: new Date() },
  });
};

export const SectionService = {
  createSection,
  getAllSections,
  getSingleSection,
  updateSection,
  deleteSection,
};
