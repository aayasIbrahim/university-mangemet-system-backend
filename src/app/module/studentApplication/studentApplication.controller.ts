import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StudentApplicationService } from "./studentApplication.service";
import { StudentApplicationValidation } from "./studentApplication.validation";
import { AppError } from "../../utils/AppError";

const apply = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const resume = files?.["resume"] ? files["resume"][0] : null;
  const additionalFiles = files?.["additionalFiles"] || [];

  const zodValidationResult = StudentApplicationValidation.apply.safeParse(
    JSON.parse(req.body.data),
  );

  if (!zodValidationResult.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      zodValidationResult.error.issues[0].message,
    );
  }
  const payload = zodValidationResult.data;
  const result = await StudentApplicationService.apply(
    payload,
    resume,
    additionalFiles,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Student application submitted successfully.",
    data: result,
  });
});
const verifyEmail = catchAsync(async (req: Request, res: Response) =>
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Application email verified.",
    data: await StudentApplicationService.verifyEmail(
      req.body.email,
      req.body.otp,
    ),
  }),
);
const approve = catchAsync(async (req: Request, res: Response) =>
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Student application approved.",
    data: await StudentApplicationService.approve(
      req.body.applicationId,
      req.user!.userId,
    ),
  }),
);
const reject = catchAsync(async (req: Request, res: Response) =>
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student application rejected.",
    data: await StudentApplicationService.reject(
      req.body.applicationId,
      req.body.reason,
      req.user!.userId,
    ),
  }),
);
const getAll = catchAsync(async (_req: Request, res: Response) =>
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student applications fetched successfully.",
    data: await StudentApplicationService.getAll(),
  }),
);

export const StudentApplicationController = {
  apply,
  verifyEmail,
  approve,
  reject,
  getAll,
};
