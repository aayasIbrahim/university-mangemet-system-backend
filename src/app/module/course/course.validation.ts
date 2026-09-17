import { z } from 'zod'; 
import { CourseType } from '../../../generated/prisma/enums';

const CreateCourseZodSchema = z.object({
  code: z
    .string("Course code is required")
    .trim()
    .min(3, "Course code must be at least 3 characters long")
    .max(20, "Course code cannot exceed 20 characters"),
    
  title: z
    .string("Course title is required")
    .trim()
    .min(3, "Course title must be at least 3 characters long")
    .max(150, "Course title cannot exceed 150 characters"),
    
  credits: z
    .number("Credits value is required")
    .positive("Credits must be a positive number value")
    .max(6, "A single course credit cannot exceed 6 credits"),
    
  type: z
    .nativeEnum(CourseType)
    .default(CourseType.CORE),
    
  departmentId: z
    .string("Department ID is required")
    .uuid("Invalid Department ID format"),
    
  programId: z
    .string("Program ID is required")
    .uuid("Invalid Program ID format"),
    
  prerequisites: z
    .array(z.string().uuid("Each prerequisite item must be a valid UUID string"))
    .optional(),
});


const UpdateCourseZodSchema = CreateCourseZodSchema.partial().omit({
  departmentId: true,
  programId: true,
});

export const CourseValidation = {
  CreateCourseZodSchema,
  UpdateCourseZodSchema,
};
