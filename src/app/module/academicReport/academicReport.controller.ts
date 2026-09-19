import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AcademicReportService } from "./academicReport.service";

const generateAcademicReport = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const reporterId = req.user?.userId;
    const result = await AcademicReportService.generateAcademicReport(
      reporterId as string,
      payload,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Academic report generated successfully.",
      data: result,
    });
  },
);

const getAcademicReports = catchAsync(async (req: Request, res: Response) => {
  const result = await AcademicReportService.getAcademicReports(
    req.query.semesterId as string | undefined,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic reports fetched successfully.",
    data: result,
  });
});

const getAcademicReport = catchAsync(async (req: Request, res: Response) => {
  const result = await AcademicReportService.getAcademicReport(
    req.params.reportId as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic report fetched successfully.",
    data: result,
  });
});

export const AcademicReportController = {
  generateAcademicReport,
  getAcademicReports,
  getAcademicReport,
};
