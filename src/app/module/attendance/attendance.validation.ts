import { z } from "zod";
import { AttendanceStatus } from "../../../generated/prisma/enums";

const AttendanceRecordSchema = z.object({
  studentId: z
    .string("Student ID is required")
    .uuid("Student ID must be a valid UUID"),
  status: z.enum(Object.values(AttendanceStatus) as [string, ...string[]], {
    message: "Attendance status is invalid",
  }),
  remarks: z
    .string("Remarks must be a string")
    .trim()
    .max(255, "Remarks cannot exceed 255 characters")
    .optional(),
});

const MarkAttendanceZodSchema = z.object({
  attendances: z
    .array(AttendanceRecordSchema)
    .min(1, "At least one attendance record is required"),
});

const UpdateAttendanceZodSchema = z
  .object({
    status: z
      .enum(Object.values(AttendanceStatus) as [string, ...string[]], {
        message: "Attendance status is invalid",
      })
      .optional(),
    remarks: z
      .string("Remarks must be a string")
      .trim()
      .max(255, "Remarks cannot exceed 255 characters")
      .nullish(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one attendance field is required for update.",
  });

export const AttendanceValidation = {
  MarkAttendanceZodSchema,
  UpdateAttendanceZodSchema,
};
