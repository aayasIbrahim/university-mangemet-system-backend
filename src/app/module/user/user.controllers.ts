import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { UserServices } from "./user.service";
import { AppError } from "../../utils/AppError";

const uploadProfileImage = catchAsync(
  async (req: Request & { file?: { buffer: Buffer } }, res: Response) => {
    if (!req.file) {
      throw new AppError(httpStatus.BAD_REQUEST, "No File Provided.");
    }
    const userId = req.user?.userId;
    await UserServices.uploadProfileImage(req.file?.buffer, userId!);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile image uploaded successfully",
      data: null,
    });
  },
);

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in.");
  }

  if (Object.keys(req.body).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "At least one profile field is required.");
  }

  const user = await UserServices.updateProfile(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

export const UserController = {
  uploadProfileImage,
  updateProfile,
};
