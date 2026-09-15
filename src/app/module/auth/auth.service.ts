import bcrypt from "bcryptjs";

import config from "../../config";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import {
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterStudentPayload,
  IRequestUser,
  IResetPasswordPayload,
  IVerifyEmailPayload,
} from "./auth.interface";
import { prisma } from "../../lib/prisma";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { googleClient } from "../../lib/gogleAuth";
import { TokenPayload } from "google-auth-library";

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
  const redisStudentData = await redisClient.get(studentRegistrationKey);
  console.log(redisStudentData);

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
      middleName: studentPayload.middleName || null,
      lastName: studentPayload.lastName,
      email: studentPayload.email,
      password: studentPayload.password,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      phone: studentPayload.phone,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      studentProfile: {
        create: {
          studentIdNo:
            studentPayload.student.studentIdNo ||
            `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: studentPayload?.student.status || "ACTIVE",
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
    name: [createdUser.firstName, createdUser.middleName, createdUser.lastName]
      .filter(Boolean)
      .join(" "),
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
const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.GONE, "User is deleted");
  }

  if (user.password === null && user.googleId !== null) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User Already Has Account Registered With Google. Try To Login With Google.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

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
    accessToken,
    refreshToken,
  };
};
const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      studentProfile: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return isUserExists;
};
const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User is inactive or not found",
    );
  }

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
    accessToken,
    refreshToken,
  };
};
const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
  }

  if (isUserExist.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === "DELETED") {
    throw new AppError(httpStatus.GONE, "User is Deleted");
  }

  if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
    throw new AppError(httpStatus.CONFLICT, "User Has Account With Google");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const key = `forgor-password-otp:${isUserExist.email}`;

  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password.ejs",
  );

  const templateData = {
    name: [isUserExist.firstName, isUserExist.middleName, isUserExist.lastName]
      .filter(Boolean)
      .join(""),
    otp,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Forgot Password",
    // text : `Your OTP is ${otp}`
    // html: `<h1>Your OTP is ${otp}</h1>`
    html,
  });
};
const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
  }

  if (isUserExist.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === "DELETED") {
    throw new AppError(httpStatus.GONE, "User is Deleted");
  }

  if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
    throw new AppError(httpStatus.CONFLICT, "User Has Account With Google");
  }

  const key = `forgor-password-otp:${isUserExist.email}`;

  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
  }

  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      email: isUserExist.email,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  await redisClient.del([key]);

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/reset-password-success.ejs",
  );

  const templateData = {
    name: [isUserExist.firstName, isUserExist.middleName, isUserExist.lastName]
      .filter(Boolean)
      .join(""),
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Password Changed",
    // text : `Your OTP is ${otp}`
    // html: `<h1>Your Password Is Changed</h1>`
    html,
  });
};
const googleLogin = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google ID Token Verification Failed", error);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid Or Expired Google Id Token",
    );
  }

  if (!googleIdTokenPayload) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid Or Expired Google Id Token",
    );
  }

  if (!googleIdTokenPayload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found");
  }
  if (!googleIdTokenPayload.name) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google Email User Name Not Found",
    );
  }

  const ifStudentExistWithGoogleAuth = await prisma.user.findFirst({
    where: {
      email: googleIdTokenPayload.email,
      googleId: googleIdTokenPayload.sub,
      role: Role.STUDENT,
    },
  });

  let user = ifStudentExistWithGoogleAuth;

  if (!ifStudentExistWithGoogleAuth) {
    const ifStudentExistWithCredentials = await prisma.user.findFirst({
      where: {
        email: googleIdTokenPayload.email,
        role: Role.STUDENT,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (ifStudentExistWithCredentials) {
      if (!ifStudentExistWithCredentials.emailVerified) {
        throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
      }

      if (ifStudentExistWithCredentials.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
      }

      if (
        ifStudentExistWithCredentials.isDeleted ||
        ifStudentExistWithCredentials.status === UserStatus.DELETED
      ) {
        throw new AppError(httpStatus.GONE, "User Is Deleted");
      }

      const googleName = (googleIdTokenPayload.name ?? "Google User").trim();
      const nameParts = googleName.split(/\s+/).filter(Boolean);
      const firstName =
        googleIdTokenPayload.given_name || nameParts[0] || "Google";
      const middleName =
        nameParts.length > 2
          ? nameParts.slice(1, -1).join(" ")
          : null;
      const lastName =
        googleIdTokenPayload.family_name ||
        nameParts[nameParts.length - 1] ||
        "User";

      user = await prisma.user.update({
        where: {
          id: ifStudentExistWithCredentials.id,
        },
        data: {
          firstName,
          middleName,
          lastName,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          imageUrl: googleIdTokenPayload.picture ?? "",
        },
      });
    } else {
      const googleName = (googleIdTokenPayload.name ?? "Google User").trim();
      const nameParts = googleName.split(/\s+/).filter(Boolean);
      const firstName =
        googleIdTokenPayload.given_name || nameParts[0] || "Google";
      const middleName =
        nameParts.length > 2
          ? nameParts.slice(1, -1).join(" ")
          : null;
      const lastName =
        googleIdTokenPayload.family_name ||
        nameParts[nameParts.length - 1] ||
        "User";

      user = await prisma.user.create({
        data: {
          firstName,
          middleName,
          lastName,
          email: googleIdTokenPayload.email,
          role: Role.STUDENT,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          imageUrl: googleIdTokenPayload.picture ?? "",
          status: UserStatus.ACTIVE,
          studentProfile: {
            create: {
              studentIdNo: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              status: "ACTIVE",
            },
          },
        },
        include: { studentProfile: true },
      });

      const tempatePath = path.join(
        process.cwd(),
        "src/app/templates/student-welcome-email.ejs",
      );

      const templateData = {
        name: [user.firstName, user.middleName, user.lastName]
          .filter(Boolean)
          .join(" "),
      };

      const html = await ejs.renderFile(tempatePath, templateData);

      await transporter.sendMail({
        from: config.email_sender,
        to: user.email,
        subject: "Welcome To University Mangement System",
        html,
      });
    }
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.GONE, "User Is Deleted");
  }

  const jwtPayload = {
    userId: user.id,
    firstName: user.firstName,
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
    accessToken,
    refreshToken,
  };
};
export const AuthService = {
  registerStudent,
  verifyStudentEmail,
  loginUser,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleLogin,
};
