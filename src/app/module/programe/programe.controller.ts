import httpStatus from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { ProgramService } from "./programe.service";
import { sendResponse } from "../../utils/sendResponse";

const createProgram = catchAsync(async (req: Request, res: Response) => {
  const result = await ProgramService.createProgram(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Academic Program created successfully!",
    data: result,
  });
});
const getAllPrograms = catchAsync(async (req: Request, res: Response) => {
  const result = await ProgramService.getAllPrograms(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic Programs fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleProgram = catchAsync(async (req: Request, res: Response) => {
  const { programId } = req.params;
  const result = await ProgramService.getSingleProgram(programId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic Program fetched successfully!",
    data: result,
  });
});

const updateProgram = catchAsync(async (req: Request, res: Response) => {
  const { programId } = req.params;
  const payload = req.body;
  const result = await ProgramService.updateProgram(
    programId as string,
    payload,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic Program updated successfully!",
    data: result,
  });
});

const deleteProgram = catchAsync(async (req: Request, res: Response) => {
  const { programId } = req.params;
  await ProgramService.deleteProgram(programId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic Program deleted successfully!",
    data: null,
  });
});
export const ProgramController = {
  createProgram,
  getAllPrograms,
  getSingleProgram,
  updateProgram,
  deleteProgram,
};
