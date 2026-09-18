import { z } from "zod";
import { ExamStatus, ExamType } from "../../../generated/prisma/enums";

const ExamFieldsSchema = z.object({
  title: z
    .string("Exam title is required")
    .trim()
    .min(2, "Exam title must be at least 2 characters")
    .max(100, "Exam title cannot exceed 100 characters"),
  type: z.nativeEnum(ExamType, {
    message: "Exam type is invalid",
  }),
  status: z.nativeEnum(ExamStatus),
  totalMarks: z
    .number("Total marks must be a number")
    .positive("Total marks must be greater than zero")
    .max(1000, "Total marks cannot exceed 1000"),
  weightage: z
    .number("Weightage must be a number")
    .min(0, "Weightage cannot be negative")
    .max(100, "Weightage cannot exceed 100%"),
  examDate: z.union([z.string(), z.date()]),
  startTime: z
    .string("Start time is required")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:MM format"),
  endTime: z
    .string("End time is required")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:MM format"),
  roomNumber: z
    .string()
    .trim()
    .max(15, "Room number cannot exceed 15 characters")
    .nullish(),
  sectionId: z
    .string("Section ID is required")
    .uuid("Invalid Section ID format"),
  instructorId: z
    .string("Instructor ID is required")
    .uuid("Invalid Instructor ID format"),
});

const CreateExamZodSchema = ExamFieldsSchema;

const UpdateExamZodSchema = ExamFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one exam field is required for update." },
);

const ExamMarkSchema = z.object({
  studentId: z
    .string("Student ID is required")
    .uuid("Student ID must be a valid UUID"),
  obtainedMarks: z
    .number("Obtained marks must be a number")
    .min(0, "Obtained marks cannot be negative")
    .max(1000, "Obtained marks cannot exceed 1000"),
  isAbsent: z.boolean().optional(),
  remarks: z
    .string()
    .trim()
    .max(255, "Remarks cannot exceed 255 characters")
    .optional(),
});

const SubmitExamMarksZodSchema = z.object({
  marks: z.array(ExamMarkSchema).min(1, "At least one exam mark is required"),
});

export const ExamValidation = {
  CreateExamZodSchema,
  UpdateExamZodSchema,
  SubmitExamMarksZodSchema,
};
