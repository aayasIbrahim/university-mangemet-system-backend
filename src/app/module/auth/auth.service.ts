import bcrypt from "bcryptjs";

import config from "../../config";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { IRegisterStudentPayload, IVerifyEmailPayload } from "./auth.interface";
import { prisma } from "../../lib/prisma";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";

const registerStudent = async (payload: IRegisterStudentPayload) => {
  const {
    firstName,
    middleName,
    lastName,
    phone,
    password,
    student: studentData,
  } = payload;

  const email = payload.email.trim().toLowerCase();
  const name = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const isUserExists = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const expirationSeconds = 5 * 60;

  const otpKey = `student-registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const studentRegistrationKey = `student-registration-data:${email}`;
  const redisUserDataPayload = {
    firstName,
    middleName,
    lastName,
    email,
    phone,
    password: hashedPassword,
    student: studentData,
  };

  await redisClient.set(
    studentRegistrationKey,
    JSON.stringify(redisUserDataPayload),
    {
      expiration: {
        type: "EX",
        value: expirationSeconds,
      },
    },
  );

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-user-otp.ejs",
  );

  const templateData = {
    name,
    email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Verification",
    // text : `Your OTP is ${otp}`
    // html: `<h1>Your OTP is ${otp}</h1>`
    html,
  });
};
const verifyStudentEmail = async (payload: IVerifyEmailPayload) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist?.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
  }

  if (isUserExist?.emailVerified) {
    throw new AppError(httpStatus.CONFLICT, "Email ALready Verified");
  }

  if (isUserExist?.isDeleted || isUserExist?.status === "DELETED") {
    throw new AppError(httpStatus.GONE, "User is Deleted");
  }

  const otpKey = `student-registration-otp:${email}`;

  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
  }

  await redisClient.del(otpKey);

  const studentRegistrationKey = `student-registration-data:${email}`;

  const redisStudentData = await redisClient.get(studentRegistrationKey);

  if (!redisStudentData) {
    throw new AppError(httpStatus.NOT_FOUND, "Student Doesnt Exist");
  }

  const studentPayload: IRegisterStudentPayload = JSON.parse(redisStudentData);

  const createdUser = await prisma.user.create({
    data: {
      firstName: studentPayload.firstName,
      middleName: studentPayload.middleName,
      lastName: studentPayload.lastName,
      email: studentPayload.email,
      password: studentPayload.password,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      phone: studentPayload.phone,
      emailVerified: true,
      studentProfile: {
        create: {
          studentIdNo: studentPayload.student.studentIdNo,
          status: studentPayload.student.status,
          batch: studentPayload.student.batch,
          program: studentPayload.student.program,
          department: studentPayload.student.department,
          semester: studentPayload.student.semester,
          address: studentPayload.student.address,
          emergencyPhone: studentPayload.student.emergencyPhone,
        },
      },
    },
    omit: { password: true },
    include: { studentProfile: true },
  });

  await redisClient.del(studentRegistrationKey);

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/student-welcome-email.ejs",
  );

  const templateData = {
    fristName: createdUser.firstName,
    middleName: createdUser.middleName || "",
    lastName: createdUser.lastName,
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Welcome To University Mangement System",
    // text : `Your OTP is ${otp}`
    // html: `<h1>Your OTP is ${otp}</h1>`
    html,
  });

  const { studentProfile, ...user } = createdUser;
  const jwtPayload = {
    userId: user.id,
    fristName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user,
    studentProfile,
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  registerStudent,
  verifyStudentEmail,
};
