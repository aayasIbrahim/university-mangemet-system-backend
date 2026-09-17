import { Router } from "express";
import { CourseController } from "./course.controller";

import { CourseValidation } from "./course.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateReques";


const router = Router();


router.post(
  "/create-course",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR), 
  validateRequest(CourseValidation.CreateCourseZodSchema),
  CourseController.createCourse
);

// // 2. Get All Courses (With Pagination, Search, filtering by department, program, or type)
// router.get(
//   "/",
//   // Kept public so students can see available course catalogs when browsing plans
//   CourseController.getAllCourses 
// );

// // 3. Get a Single Course by ID (Includes its prerequisite graph details)
// router.get(
//   "/:id",
//   CourseController.getCourseById
// );

// // 4. Update Course Details (Can dynamically link/unlink prerequisites via nested actions)
// router.patch(
//   "/:id",
//   auth("SUPER_ADMIN", "REGISTRAR", "DEPARTMENT_ADMIN"), // Dept heads can update descriptions or credits
//   validateRequest(CourseValidation.UpdateCourseZodSchema),
//   CourseController.updateCourse
// );

// // 5. Soft Delete a Course
// router.delete(
//   "/:id",
//   auth("SUPER_ADMIN"), // Destructive action restricted strictly to Super Admin
//   CourseController.deleteCourse
// );

// // 6. [Advanced Specialty Route] Get Prerequisites of a Specific Course directly
// router.get(
//   "/:id/prerequisites",
//   CourseController.getCoursePrerequisites
// );

export const CourseRoutes = router;
