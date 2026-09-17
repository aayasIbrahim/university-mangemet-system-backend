import { Request, Response } from "express";
import httpStatus from "http-status";
import { CourseService } from "./course.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.createCourse(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Course created successfully!",
    data: result,
  });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.getAllCourses(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courses fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});


const getSingleCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const result = await CourseService.getSingleCourse(courseId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course detailed profile retrieved successfully!',
    data: result,
  });
});

// /**
//  * 4. Update Course Details & Prerequisites
//  */
// const updateCourse = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const result = await CourseService.updateCourse(id, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Course detailed metadata updated successfully!',
//     data: result,
//   });
// });

// /**
//  * 5. Soft Delete Course Track
//  */
// const deleteCourse = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   await CourseService.deleteCourse(id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Course dropped and soft-deleted successfully!',
//     data: null,
//   });
// });
// // const getCoursePrerequisites = catchAsync(async (req: Request, res: Response) => {
// //   const { id } = req.params;
// //   const result = await CourseService.getCoursePrerequisites(id);

// //   sendResponse(res, {
// //     statusCode: StatusCodes.OK,
// //     success: true,
// //     message: "Course prerequisites fetched successfully!",
// //     data: result,
// //   });
// // });

export const CourseController = {
  createCourse,
  getAllCourses,
 getSingleCourse
  //   updateCourse,
  //   deleteCourse,
};
