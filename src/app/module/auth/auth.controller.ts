import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import { AppError } from "../../utils/AppError";

const registerStudent = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.registerStudent(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Verification OTP Sent",
    data: null,
  });
});

export const AuthController = {
registerStudent
 
};
