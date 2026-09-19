import { z } from 'zod';

// const EnrollInCourseZodSchema = z.object({
//   body: z.object({
//     sectionId: z
//       .string( 'Section UUID identifier is required.' )
//       .uuid({ message: 'Invalid field structure. Must be a valid UUID v4 format.' }),
    
//     studentId: z
//       .string()
//       .uuid({ message: 'Invalid field structure. Must be a valid UUID v4 format.' })
//       .optional(), 
//   }),
// });

const UpdateEnrollmentMarksZodSchema = z.object({
  body: z.object({
    classTestsMark: z
      .number( 'Class Test score metric must be a numeric value' )
      .min(0, 'Scores cannot scale below absolute zero (0.00)')
      .max(100, 'Individual composite weights cannot exceed institutional ceilings (100.00)')
      .optional(),

    midTermMark: z
      .number( 'Midterm assessment metric must be a numeric value' )
      .min(0, 'Scores cannot scale below absolute zero (0.00)')
      .max(100, 'Individual composite weights cannot exceed institutional ceilings (100.00)')
      .optional(),

    finalExamMark: z
      .number( 'Final evaluation mark metric must be a numeric value')
      .min(0, 'Scores cannot scale below absolute zero (0.00)')
      .max(100, 'Individual composite weights cannot exceed institutional ceilings (100.00)')
      .optional(),

    attendanceMark: z
      .number( 'Attendance calculation factor must be a numeric value' )
      .min(0, 'Scores cannot scale below absolute zero (0.00)')
      .max(100, 'Individual composite weights cannot exceed institutional ceilings (100.00)')
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one operational marking component parameter must be passed during update sequence context.",
  }),
});

export const CourseEnrollmentValidation = {
  // EnrollInCourseZodSchema,
  UpdateEnrollmentMarksZodSchema,
};