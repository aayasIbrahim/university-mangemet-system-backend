import { Request, Response } from "express";
import httpStatus from "http-status";
import { SemesterService } from "./semester.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

// ১. Create Semester
const createSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.createSemester(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Semester created successfully!",
    data: result,
  });
});

// ২. Get All Semesters
const getAllSemesters = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.getAllSemesters(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semesters fetched successfully!",
    data: result.data,
    meta: result.meta,
  });
});

// ৩. Get Single Semester
const getSingleSemester = catchAsync(async (req: Request, res: Response) => {
  const { semesterId } = req.params;
  const result = await SemesterService.getSingleSemester(semesterId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semester detailed profile retrieved successfully!",
    data: result,
  });
});

// ৪. Update Semester
const updateSemester = catchAsync(async (req: Request, res: Response) => {
  const { semesterId } = req.params;
  const result = await SemesterService.updateSemester(semesterId as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semester detailed metadata updated successfully!",
    data: result,
  });
});

// ৫. Delete Semester (Soft Delete)
const deleteSemester = catchAsync(async (req: Request, res: Response) => {
  const { semesterId } = req.params;
  await SemesterService.deleteSemester(semesterId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semester dropped and soft-deleted successfully!",
    data: null,
  });
});

export const SemesterController = {
  createSemester,
  getAllSemesters,
  getSingleSemester,
  updateSemester,
  deleteSemester,
};
