import { z } from "zod";


const CreateDepartmentZodSchema = z.object({
  name: z
    .string("Department name is required") // Acts as both required and type error
    .trim()
    .min(2, "Department name must be at least 2 characters long")
    .max(120, "Department name cannot exceed 120 characters"),

  code: z
    .string("Department code is required")
    .min(2, "Department code must be at least 2 characters long")
    .max(20, "Department code cannot exceed 20 characters"),

  description: z
    .string("Description must be a text value")
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullish(),
});
const UpdateDepartmentZodSchema = z.object({
  name: z
    .string("Department name is required") // Acts as both required and type error
    .trim()
    .min(2, "Department name must be at least 2 characters long")
    .max(120, "Department name cannot exceed 120 characters")
    .optional(),

  code: z
    .string("Department code is required")
    .min(2, "Department code must be at least 2 characters long")
    .max(20, "Department code cannot exceed 20 characters")
    .optional(),

  description: z
    .string("Description must be a text value")
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullish()
    .optional(),

  isActive: z.boolean().optional(),
});
export const DepartmentValidation = {
  CreateDepartmentZodSchema,
  UpdateDepartmentZodSchema,
};
