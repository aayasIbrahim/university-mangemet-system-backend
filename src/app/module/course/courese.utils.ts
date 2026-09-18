import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

export const validatePrerequisites = async (
  prerequisites: string[],
  courseId: string | undefined,
  programId: string,
) => {
  if (courseId && prerequisites.includes(courseId)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A course cannot have itself listed as a prerequisite.",
    );
  }

  if (prerequisites.length === 0) return;

  const validPrerequisiteCount = await prisma.course.count({
    where: {
      id: { in: prerequisites },
      programId,
      isActive: true,
      isDeleted: false,
    },
  });

  if (validPrerequisiteCount !== prerequisites.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Every prerequisite must be an active course from the same program.",
    );
  }
};
