import { z } from "zod";
import { ProgramType } from "../../../generated/prisma/enums";

const CreateProgramZodSchema = z.object({
  name: z
    .string("Program name is required")
    .trim()
    .min(2, "Program name must be at least 2 characters long")
    .max(150, "Program name cannot exceed 150 characters"),

  code: z
    .string("Program code is required")
    .trim()
    .min(2, "Program code must be at least 2 characters long")
    .max(20, "Program code cannot exceed 20 characters"),

  degree: z
    .string()
    .trim()
    .max(80, "Degree title cannot exceed 80 characters")
    .nullish(), // allows null, undefined, or missing entirely

  durationYears: z
    .number("Duration must be a number")
    .int("Duration must be an integer")
    .positive("Duration must be a positive number")
    .max(10, "Duration cannot exceed 10 years")
    .nullish(),

  description: z.string().trim().max(5000, "Description is too long").nullish(),

  totalCredits: z
    .number("Total credits must be a number")
    .int("Total credits must be an integer")
    .positive("Total credits must be a positive number")
    .default(120),

  type: z.nativeEnum(ProgramType).default(ProgramType.UNDERGRADUATE),

  isActive: z.boolean().default(true),

  departmentId: z
    .string("Department ID is required")
    .uuid("Invalid Department ID format"),
});

const UpdateProgramZodSchema = CreateProgramZodSchema.partial().omit({
  departmentId: true,
});

export const ProgramValidation = {
  CreateProgramZodSchema,
  UpdateProgramZodSchema,
};
