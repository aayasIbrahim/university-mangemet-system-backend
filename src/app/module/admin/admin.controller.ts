import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import { Role } from "../../../generated/prisma/enums";

const getContext = (req: Request) => ({ ipAddress: req.ip, userAgent: req.get("user-agent") || undefined });
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.listUsers(req.query as never);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Users fetched successfully.", data: result.data, meta: result.meta });
});
const updateRole = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserRole(req.params.id as string, req.body.role as Role, req.user!.userId, getContext(req));
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "User role updated successfully.", data: result });
});
const getDashboardStats = catchAsync(async (_req: Request, res: Response) => sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Dashboard statistics fetched successfully.", data: await AdminService.getDashboardStats() }));
const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAuditLogs(req.query as never);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Audit logs fetched successfully.", data: result.data, meta: result.meta });
});

export const AdminController = { getUsers, updateRole, getDashboardStats, getAuditLogs };