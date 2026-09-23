import { z } from "zod";
const apply = z.object({
  user: z.object({
    firstName: z
      .string( "First name is required" ) // 
      .trim()
      .min(2, "First name must be at least 2 characters long"),
      
    middleName: z.string().trim().max(100).optional().or(z.literal("")),
    
    lastName: z
      .string( "Last name is required" ) // 
      .trim()
      .min(2, "Last name must be at least 2 characters long"),
      
    email: z
      .string( "Email is required" ) // 🟢
      .email("Invalid email format")
      .trim()
      .toLowerCase(),
      
    phone: z.string().trim().min(8).max(32).optional().or(z.literal("")),
  }),

  studentApplication: z.object({
    programId: z
      .string("Program ID is required" ) // 🟢 ফিক্সড
      .uuid("Invalid Program ID format"),
      
    batch: z
      .string( "Batch is required" ) // 🟢 ফিক্সড
      .trim()
      .min(2, "Batch name must be at least 2 characters long")
      .max(50),
      
    address: z
      .string( "Address is required" ) // 🟢 ফিক্সড
      .trim()
      .min(5, "Address must be at least 5 characters long")
      .max(2000),
      
    emergencyPhone: z
      .string()
      .trim()
      .min(8, "Emergency phone must be at least 8 characters long")
      .max(32)
      .optional()
      .or(z.literal("")),
  }),
});
const verifyEmail = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().length(6, "OTP must be exactly 6 characters"),
});

const approve = z.object({
  applicationId: z.string().uuid("Invalid Application ID"),
});

const reject = z.object({
  applicationId: z.string().uuid("Invalid Application ID"),
  reason: z.string("Reason is required").trim().min(3).max(500),
});

export const StudentApplicationValidation = {
  apply,
  verifyEmail,
  approve,
  reject,
};
