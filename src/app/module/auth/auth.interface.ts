import type { Role, StudentStatus } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IStudentProfileInput {
  status?: StudentStatus;
  studentIdNo?: string;
  batch?: string;
  program?: string;
  department?: string;
  semester?: number;
  address?: string;
  emergencyPhone?: string;
}
export interface IRegisterStudentPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  student?: IStudentProfileInput;
}
export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}
export interface IGoogleLoginPayload {
  idToken: string;
}

export interface IForgotPasswordPayload {
  email: string;
}
export interface IResetPasswordPayload {
  email: string;
  newPassword: string;
  otp: string;
}
