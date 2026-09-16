import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { DepartmentService } from "./department.service";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;

  const result = await DepartmentService.createDepartment(payload, user!);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Department created successfully",
    data: result,
  });
});
const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await DepartmentService.getAllDepartments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Departments fetched successfully!",
    data: data,
    meta: meta,
  });
});
const getSingleDepartment = catchAsync(async (req: Request, res: Response) => {
  const { departmentId } = req.params;

  const result = await DepartmentService.getSingleDepartment(
    departmentId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department fetched successfully!",
    data: result,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const { departmentId } = req.params;
  const payload = req.body;

  const result = await DepartmentService.updateDepartment(
    departmentId as string,
    payload,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department updated successfully!",
    data: result,
  });
});
const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const { departmentId } = req.params;
  await DepartmentService.deleteDepartment(departmentId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department deleted successfully!",
    data: null,
  });
});

const getDepartmentPrograms = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await DepartmentService.getDepartmentPrograms(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Department programs fetched successfully!",
      data: result,
    });
  },
);

export const DepartmentController = {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentPrograms,
};
