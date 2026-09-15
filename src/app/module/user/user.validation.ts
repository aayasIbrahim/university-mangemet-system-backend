import z from "zod";

export const UpdateProfileZodSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name cannot exceed 100 characters")
      .optional(),
    middleName: z
      .string()
      .trim()
      .max(100, "Middle name cannot exceed 100 characters")
      .nullable()
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(100, "Last name cannot exceed 100 characters")
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,20}$/, "Phone number is invalid")
      .nullable()
      .optional(),
    address: z
      .string()
      .trim()
      .max(500, "Address cannot exceed 500 characters")
      .nullable()
      .optional(),
    emergencyPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,20}$/, "Emergency phone number is invalid")
      .nullable()
      .optional(),
  })
  .strict();

export const UserValidation = {
  UpdateProfileZodSchema,
};
