import { z } from "zod";

const SectionFieldsSchema = z.object({
  sectionName: z
    .string("Section name is required")
    .trim()
    .min(1, "Section name is required")
    .max(20, "Section name cannot exceed 20 characters"),
  capacity: z
    .number("Capacity must be a number")
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity cannot exceed 1000")
    .optional(),
  courseId: z.string("Course ID is required").uuid("Invalid Course ID format"),
  semesterId: z
    .string("Semester ID is required")
    .uuid("Invalid Semester ID format"),
  isActive: z.boolean().optional(),
});

const CreateSectionZodSchema = SectionFieldsSchema;

const UpdateSectionZodSchema = SectionFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one section field is required for update." },
);

export const SectionValidation = {
  CreateSectionZodSchema,
  UpdateSectionZodSchema,
};
