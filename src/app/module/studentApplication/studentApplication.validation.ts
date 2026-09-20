import { z } from "zod";

const apply = z.object({
  firstName: z.string().trim().min(2).max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().min(2).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(8).max(32).optional().or(z.literal("")),
  password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  programId: z.uuid(),
  batch: z.string().trim().min(2).max(50),
  address: z.string().trim().min(5).max(2000),
  emergencyPhone: z.string().trim().min(8).max(32).optional().or(z.literal("")),
});

const verifyEmail = z.object({ email: z.email(), otp: z.string().length(6) });
const approve = z.object({ applicationId: z.uuid() });
const reject = z.object({ applicationId: z.uuid(), reason: z.string().trim().min(3).max(500) });

export const StudentApplicationValidation = { apply, verifyEmail, approve, reject };