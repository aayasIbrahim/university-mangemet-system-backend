import { z } from "zod";

const SemesterFieldsSchema = z.object({
  name: z
    .string("Semester name is required")
    .trim()
    .min(3, "Semester name must be at least 3 characters long")
    .max(30, "Semester name cannot exceed 30 characters"), // @db.VarChar(30)

  code: z
    .string("Semester code is required")
    .trim()
    .min(2, "Semester code must be at least 2 characters long")
    .max(10, "Semester code cannot exceed 10 characters"), // @db.VarChar(10)

  startDate: z
    .string("Start date is required")
    .datetime({ message: "Invalid start date format. Must be an ISO string" }),

  endDate: z
    .string("End date is required")
    .datetime({ message: "Invalid end date format. Must be an ISO string" }),

  isCurrent: z.boolean().default(false).optional(),

  isActive: z.boolean().default(true).optional(),
});

const CreateSemesterZodSchema = SemesterFieldsSchema.refine(
  (data) => {
    return new Date(data.startDate) < new Date(data.endDate);
  },
  {
    message: "Start date must be earlier than the end date!",
    path: ["startDate"],
  },
);

const UpdateSemesterZodSchema = SemesterFieldsSchema.partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one semester field is required for update.",
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) < new Date(data.endDate),
    {
      message: "Start date must be earlier than the end date!",
      path: ["startDate"],
    },
  );

export const SemesterValidation = {
  CreateSemesterZodSchema,
  UpdateSemesterZodSchema,
};
