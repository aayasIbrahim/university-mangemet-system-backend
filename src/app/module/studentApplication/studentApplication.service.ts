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
import { UploadApiResponse } from "cloudinary";
import {
  generateApplicationNo,
  generateZodCompliantPassword,
} from "./studentApplication.utils";
import { IApplyStudentApplication } from "./studentApplication.interface";

const apply = async (
  payload: IApplyStudentApplication,
  resume: Express.Multer.File | null,
  additionalFiles: Express.Multer.File[],
) => {
  const email = payload.user.email.trim().toLowerCase();
  const [existingUser, existingApplication, program] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.studentApplication.findUnique({
      where: { email },
      select: { id: true, status: true },
    }),
    prisma.program.findFirst({
      where: {
        id: payload.studentApplication.programId,
        isActive: true,
        isDeleted: false,
      },
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
  const resumeUploadResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },

          async (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new AppError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  "No result returned from Cloudinary",
                ),
              );
            }

            resolve(result);
          },
        )
        .end(resume?.buffer);
    },
  );

  console.log({ resumeUploadResult });

  const additionalFilesUploadResults = await Promise.all(
    additionalFiles.map((file) => {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
            },

            async (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(new Error("No result returned from Cloudinary"));
              }

              resolve(result);
            },
          )
          .end(file.buffer);
      });
    }),
  );

  const randomStudentPassword = generateZodCompliantPassword();
  const applicationNo = generateApplicationNo();
  const passwordHash = await bcrypt.hash(
    randomStudentPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const studentApplication = await prisma.user.create({
    data: {
      email,
      firstName: payload.user.firstName,
      middleName: payload.user.middleName || null,
      lastName: payload.user.lastName,
      phone: payload.user.phone || null,
      password: passwordHash,
      role: Role.STUDENT,
      needPasswordChange: true,
      status: UserStatus.ACTIVE,

      studentApplication: {
        create: {
          applicationNo,
          firstName: payload.user.firstName,
          middleName: payload.user.middleName || null,
          lastName: payload.user.lastName,
          email,
          phone: payload.user.phone || null,
          passwordHash: passwordHash,
          programId: payload.studentApplication.programId,
          batch: payload.studentApplication.batch,
          address: payload.studentApplication.address,
          emergencyPhone: payload.studentApplication.emergencyPhone || null,
          resume: resumeUploadResult.secure_url,
          resumePublicId: resumeUploadResult.public_id,
          additionalFiles: additionalFilesUploadResults.map((file) => ({
            url: file.secure_url,
            publicId: file.public_id,
          })),
        },
      },
    },
    include: {
      studentApplication: {
        select: {
          applicationNo: true,
          email: true,
        },
      },
    },
  });

  const expirationSeconds = 60 * 60;

  const otpKey = `student-application-otp:${payload.user.email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-user-otp.ejs",
  );
  const name = [
    payload.user.firstName,
    payload.user?.middleName,
    payload.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const templateData = {
    name,
    email: payload.user.email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: payload.user.email,
    subject: "Student Application - Email Verification",
    html,
  });

  return studentApplication;
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
