import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AttendanceService } from "./attendance.service";

const markSessionAttendance = catchAsync(
  async (req: Request, res: Response) => {
    const { classSessionId } = req.params;
    const currentUserId = req.user?.userId;
    const payload=req.body

    const result = await AttendanceService.markSessionAttendance(
      classSessionId as string,
      currentUserId!,
   payload
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance marked successfully.",
      data: result,
    });
  },
);

// const getSessionAttendance = catchAsync(async (req: Request, res: Response) => {
//   const { classSessionId } = req.params;

//   const result = await AttendanceService.getSessionAttendance(
//     classSessionId as string,
//     req.query,
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Class attendance fetched successfully.",
//     meta: result.meta,
//     data: result.data,
//   });
// });

// const getStudentAttendance = catchAsync(async (req: Request, res: Response) => {
//   const { studentId } = req.params;

//   const result = await AttendanceService.getStudentAttendance(
//     studentId as string,
//     req.query,
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Student attendance history fetched successfully.",
//     meta: result.meta,
//     data: result.data,
//   });
// });

// const updateAttendance = catchAsync(async (req: Request, res: Response) => {
//   const { attendanceId } = req.params;
//   const currentUser = req.user;

//   const result = await AttendanceService.updateAttendance(
//     attendanceId as string,
//     currentUser!.userId,
//     req.body,
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Attendance updated successfully.",
//     data: result,
//   });
// });

export const AttendanceController = {
  markSessionAttendance,
//   getSessionAttendance,
//   getStudentAttendance,
//   updateAttendance,
};
