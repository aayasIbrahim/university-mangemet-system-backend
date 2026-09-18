import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ExamService } from "./exam.service";
import { Role } from "../../../generated/prisma/enums";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

const createExam = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user;
  const payload = req.body;

  let targetedInstructorId: string;

 
  if (
    currentUser?.role === Role.SUPER_ADMIN ||
    currentUser?.role === Role.REGISTRAR ||
    currentUser?.role === Role.DEPARTMENT_ADMIN
  ) {
    if (!payload.instructorId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Administrative exam creation requires an 'instructorId' in the request body.",
      );
    }
    targetedInstructorId = payload.instructorId;
  } 
  // 2. Automated Profile Lookup Layer for Instructors
  else {
    if (!currentUser?.userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authenticated User ID is required for exam creation configuration.",
      );
    }

   
    const instructorProfile = await prisma.instructorProfile.findFirst({
      where: { userId: currentUser.userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!instructorProfile) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Active Instructor profile not found for this authenticated user account.",
      );
    }

    targetedInstructorId = instructorProfile.id;
  }

 
  const result = await ExamService.createExam({
    ...payload,
    instructorId: targetedInstructorId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Exam created successfully.",
    data: result,
  });
});

const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const result = await ExamService.getAllExams(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exams fetched successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleExam = catchAsync(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const result = await ExamService.getSingleExam(examId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exam fetched successfully.",
    data: result,
  });
});

const updateExam = catchAsync(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const result = await ExamService.updateExam(examId as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exam updated successfully.",
    data: result,
  });
});

const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const { examId } = req.params;
  await ExamService.deleteExam(examId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exam deleted successfully.",
    data: null,
  });
});

const submitExamMarks = catchAsync(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const result = await ExamService.submitExamMarks(
    examId as string,
    req.user!.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exam marks submitted successfully.",
    data: result,
  });
});

const getExamMarks = catchAsync(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const result = await ExamService.getExamMarks(examId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exam marks fetched successfully.",
    data: result,
  });
});

export const ExamController = {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam,
  submitExamMarks,
  getExamMarks,
};
