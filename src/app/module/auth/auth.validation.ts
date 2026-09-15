import z from "zod";

const StudentProfileSchema = z
  .object({
    status: z.enum(["ACTIVE", "SUSPENDED", "GRADUATED", "WITHDRAWN"]).optional().default("ACTIVE"),
    studentIdNo: z
      .string()
      .trim()
      .regex(/^STU-\d{4}-\d{3,}$/, "Invalid ID format. Must match STU-YYYY-XXX")
      .optional(),
    batch: z.string().trim().min(2).max(50).optional(),
    program: z.string().trim().min(2).max(120).optional(),
    department: z.string().trim().min(2).max(120).optional(),
    semester: z.number().int().min(1).max(20).optional(),
    address: z.string().trim().max(500).optional(),
    emergencyPhone: z.string().trim().min(8).max(32).optional(),
  })
  .default({ status: "ACTIVE" });

const StudentRegistrationZodSchema = z.object({
  firstName: z
    .string({ message: "First name is required" })
    .trim()
    .min(2, "First name must be at least 2 characters long")
    .max(100, "First name cannot exceed 100 characters"),

  middleName: z
    .string()
    .trim()
    .max(100, "Middle name cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),

  lastName: z
    .string({ message: "Last name is required" })
    .trim()
    .min(2, "Last name must be at least 2 characters long")
    .max(100, "Last name cannot exceed 100 characters"),

  email: z.string({ message: "Email is required" }).trim().email("Please enter a valid email address"),

  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),

  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,20}$/, "Phone number is invalid")
    .optional()
    .or(z.literal("")),

  student: StudentProfileSchema.optional(),
});
const StudentEmailVerifyZodSchema = z.object({
  email: z.email("Not email!!"),
  otp: z.string().length(6),
});
const LoginZodSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "Password Must Minimum 8 Characters Long.")
    .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
    .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

    .regex(/[0-9]/, "Password must contain atleast 1 Number")
    .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
});

const ForgotPasswordZodSchema = z.object({
  email: z.email(),
});

const ResetPasswordZodSchema = z.object({
  email: z.email(),
  newPassword: z
    .string()
    .min(8, "Password Must Minimum 8 Characters Long.")
    .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
    .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

    .regex(/[0-9]/, "Password must contain atleast 1 Number")
    .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
  otp: z.string().length(6),
});
export const UserValidation = {
  StudentRegistrationZodSchema,
  StudentEmailVerifyZodSchema,
  LoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema
};
