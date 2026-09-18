import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CourseEnrollmentService } from "./courseEnrollment.service";
import { AppError } from "../../utils/AppError";
import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const enrollInCourse = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user;
  const { sectionId, studentId } = req.body;

  let targetedStudentId: string;

  if (
    currentUser?.role === Role.SUPER_ADMIN ||
    currentUser?.role === Role.DEPARTMENT_ADMIN
  ) {
    if (!studentId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Administrative enrollment requires a 'studentId' in the request body.",
      );
    }

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: currentUser.userId, isDeleted: false },
      select: { id: true },
    });

    if (!studentProfile) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No matching Student Profile found for this authenticated user account.",
      );
    }

    targetedStudentId = studentId!;
  } else {
    if (!currentUser?.userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authenticated Student ID is required for enrollment.",
      );
    }

    targetedStudentId = currentUser.userId;
  }

  const result = await CourseEnrollmentService.enrollInCourse({
    sectionId,
    studentId: targetedStudentId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Student successfully enrolled in the course section!",
    data: result,
  });
});
const updateEnrollmentMarks = catchAsync(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    const payload = req.body;
    const result = await CourseEnrollmentService.updateEnrollmentMarks(
      enrollmentId as string,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Student marks breakdown and final grades evaluated successfully!",
      data: result,
    });
  },
);
// delete enrolledCourse
const dropEnrolledCourse = catchAsync(async (req: Request, res: Response) => {
  const { enrollmentId } = req.params;
  const result = await CourseEnrollmentService.dropEnrolledCourse(
    enrollmentId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Course enrollment dropped and soft-deleted successfully.",
    data: result,
  });
});

const getMyEnrollments = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.userId || (req.query.studentId as string);

  const result = await CourseEnrollmentService.getMyEnrollments(
    studentId,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student academic enrollments dataset loaded.",
    meta: result.meta,
    data: result.data,
  });
});

export const CourseEnrollmentController = {
  enrollInCourse,
  dropEnrolledCourse,
  getMyEnrollments,
  updateEnrollmentMarks,
};
