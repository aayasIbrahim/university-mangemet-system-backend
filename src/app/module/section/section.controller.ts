import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SectionService } from "./section.service";

const createSection = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.createSection(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Section created successfully!",
    data: result,
  });
});

const getAllSections = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.getAllSections(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sections fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleSection = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.getSingleSection(req.params.sectionId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Section details retrieved successfully!",
    data: result,
  });
});

const updateSection = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.updateSection(
    req.params.sectionId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Section updated successfully!",
    data: result,
  });
});

const deleteSection = catchAsync(async (req: Request, res: Response) => {
  await SectionService.deleteSection(req.params.sectionId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Section deleted successfully!",
    data: null,
  });
});

export const SectionController = {
  createSection,
  getAllSections,
  getSingleSection,
  updateSection,
  deleteSection,
};
