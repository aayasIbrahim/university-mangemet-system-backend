import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "node:path";
import { AppError } from "../../utils/AppError";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { cloudinary } from "../../lib/cloudinary";
import {
  UserStatus,
  Role,
  StudentApplicationStatus,
} from "../../../generated/prisma/enums";

type ApplicationFiles = {
  resume?: Express.Multer.File[];
  additionalFiles?: Express.Multer.File[];
};

const uploadFile = (file: Express.Multer.File) =>
  new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "auto", folder: "student-applications" },
        (error, result) => {
          if (error || !result)
            reject(error || new Error("File upload failed"));
          else resolve(result.secure_url);
        },
      )
      .end(file.buffer);
  });

const apply = async (
  payload: Record<string, string>,
  files: ApplicationFiles = {},
) => {
  const email = payload.email.trim().toLowerCase();
  const [existingUser, existingApplication, program] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.studentApplication.findUnique({
      where: { email },
      select: { id: true, status: true },
    }),
    prisma.program.findFirst({
      where: { id: payload.programId, isActive: true, isDeleted: false },
      select: { id: true },
    }),
  ]);
  if (existingUser)
    throw new AppError(
      httpStatus.CONFLICT,
      "An account already exists with this email.",
    );
  if (existingApplication?.status === StudentApplicationStatus.PENDING)
    throw new AppError(
      httpStatus.CONFLICT,
      "An application is already pending for this email.",
    );
  if (!program)
    throw new AppError(httpStatus.NOT_FOUND, "Active program not found.");
  if (!files.resume?.[0])
    throw new AppError(httpStatus.BAD_REQUEST, "Resume is required.");

  const passwordHash = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );
  const resumeUrl = await uploadFile(files.resume[0]);
  const additionalFiles = await Promise.all(
    (files.additionalFiles || []).map(uploadFile),
  );
  const application = await prisma.studentApplication.upsert({
    where: { email },
    create: {
      firstName: payload.firstName,
      middleName: payload.middleName || null,
      lastName: payload.lastName,
      email,
      phone: payload.phone || null,
      passwordHash,
      programId: payload.programId,
      batch: payload.batch,
      address: payload.address,
      emergencyPhone: payload.emergencyPhone || null,
      resumeUrl,
      additionalFiles,
      applicationNo: `APP-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
    update: {
      firstName: payload.firstName,
      middleName: payload.middleName || null,
      lastName: payload.lastName,
      phone: payload.phone || null,
      passwordHash,
      programId: payload.programId,
      batch: payload.batch,
      address: payload.address,
      emergencyPhone: payload.emergencyPhone || null,
      resumeUrl,
      additionalFiles,
      status: StudentApplicationStatus.PENDING,
      rejectionReason: null,
      emailVerified: false,
      verifiedAt: null,
    },
    include: { program: { select: { id: true, name: true, code: true } } },
  });
  const otp = crypto.randomInt(100000, 1000000).toString();
  await redisClient.set(`student-application-otp:${email}`, otp, {
    expiration: { type: "EX", value: 600 },
  });
  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Verify your student application",
    html: await ejs.renderFile(
      path.join(process.cwd(), "src/app/templates/registration-user-otp.ejs"),
      { name: payload.firstName, email, otp, expirationMinutes: 10 },
    ),
  });
  return {
    applicationNo: application.applicationNo,
    email: application.email,
    message: "Verification OTP sent.",
  };
};

const verifyEmail = async (emailInput: string, otp: string) => {
  const email = emailInput.trim().toLowerCase();
  const application = await prisma.studentApplication.findUnique({
    where: { email },
  });
  if (!application)
    throw new AppError(httpStatus.NOT_FOUND, "Student application not found.");
  if (application.status !== StudentApplicationStatus.PENDING)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This application is no longer pending.",
    );
  const savedOtp = await redisClient.get(`student-application-otp:${email}`);
  if (!savedOtp || savedOtp !== otp)
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP.");
  await redisClient.del(`student-application-otp:${email}`);
  return prisma.studentApplication.update({
    where: { id: application.id },
    data: { emailVerified: true, verifiedAt: new Date() },
    select: {
      applicationNo: true,
      email: true,
      emailVerified: true,
      status: true,
    },
  });
};

const approve = async (applicationId: string, reviewerId: string) =>
  prisma.$transaction(async (tx) => {
    const application = await tx.studentApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application)
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Student application not found.",
      );
    if (!application.emailVerified)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Applicant email is not verified.",
      );
    if (application.status !== StudentApplicationStatus.PENDING)
      throw new AppError(
        httpStatus.CONFLICT,
        "Application has already been reviewed.",
      );

    let studentIdNo = "";
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `STU-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;
      const existingProfile = await tx.studentProfile.findUnique({
        where: { studentIdNo: candidate },
        select: { id: true },
      });
      if (!existingProfile) {
        studentIdNo = candidate;
        break;
      }
    }

    if (!studentIdNo) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Could not generate a unique student ID. Please try again.",
      );
    }

    const user = await tx.user.create({
      data: {
        firstName: application.firstName,
        middleName: application.middleName,
        lastName: application.lastName,
        email: application.email,
        password: application.passwordHash,
        phone: application.phone,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: application.verifiedAt || new Date(),
        studentProfile: {
          create: {
            studentIdNo,
            batch: application.batch,
            address: application.address,
            emergencyPhone: application.emergencyPhone,
            programId: application.programId,
          },
        },
      },
      omit: { password: true },
      include: { studentProfile: true },
    });
    await tx.studentApplication.update({
      where: { id: application.id },
      data: {
        status: StudentApplicationStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
    return user;
  });

const reject = async (
  applicationId: string,
  reason: string,
  reviewerId: string,
) => {
  const application = await prisma.studentApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application)
    throw new AppError(httpStatus.NOT_FOUND, "Student application not found.");
  if (application.status !== StudentApplicationStatus.PENDING)
    throw new AppError(
      httpStatus.CONFLICT,
      "Application has already been reviewed.",
    );

  return prisma.studentApplication.update({
    where: { id: applicationId },
    data: {
      status: StudentApplicationStatus.REJECTED,
      rejectionReason: reason,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
    select: {
      applicationNo: true,
      email: true,
      status: true,
      rejectionReason: true,
    },
  });
};
const getAll = () =>
  prisma.studentApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: { program: { select: { name: true, code: true } } },
  });

export const StudentApplicationService = {
  apply,
  verifyEmail,
  approve,
  reject,
  getAll,
};
