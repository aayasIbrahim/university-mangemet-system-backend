import bcrypt from "bcryptjs";
import {
  EnrollmentStatus,
  Role,
  UserStatus,
} from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN,
      },
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    const firstName = config.super_admin_frist_name;
    const lastName = config.super_admin_last_name;
    const email = config.super_admin_email;
    const password = config.super_admin_password;

    if (!firstName || !lastName || !email || !password) {
      throw new AppError(
        500,
        "Super Admin Name , Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const superAdmin = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Super Admin Created : ", superAdmin);
  } catch (error) {
    console.log("Error Seeding Super Admin : ", error);

    await prisma.user.delete({
      where: {
        email: config.super_admin_email,
      },
    });
  }
};

//create tester admin

export const seedTesterAdmin = async () => {
  try {
    const isTesterAdminExist = await prisma.user.findUnique({
      where: {
        email: config.tester_admin_email,
      },
    });

    if (isTesterAdminExist) {
      console.log("Tester Admin Already Exists!");
      return;
    }

    const firstName = config.tester_admin_first_name;
    const lastName = config.tester_admin_last_name;
    const email = config.tester_admin_email;
    const password = config.tester_admin_password;

    if (!firstName || !lastName || !email || !password) {
      throw new AppError(
        500,
        "Tester Admin Name , Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const testerAdmin = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: Role.DEPARTMENT_ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log(`Tester Admin Created: ${testerAdmin.email}`);
  } catch (error) {
    console.log("Error Seeding Tester Admin : ", error);

    await prisma.user.delete({
      where: {
        email: config.tester_admin_email,
      },
    });
  }
};

const seedRoleUser = async (user: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}) => {
  const hashedPassword = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds) || 10,
  );

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: UserStatus.ACTIVE,
      isActive: true,
      isDeleted: false,
    },
    create: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hashedPassword,
      role: user.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      needPasswordChange: false,
    },
    select: { id: true, email: true },
  });
};

export const seedTesterAcademicUsers = async () => {
  const financeAdmin = await seedRoleUser({
    firstName: config.tester_finance_admin_first_name,
    lastName: config.tester_finance_admin_last_name,
    email: config.tester_finance_admin_email,
    password: config.tester_finance_admin_password,
    role: Role.FINANCE_ADMIN,
  });
  const registrar = await seedRoleUser({
    firstName: config.tester_registrar_first_name,
    lastName: config.tester_registrar_last_name,
    email: config.tester_registrar_email,
    password: config.tester_registrar_password,
    role: Role.REGISTRAR,
  });
  const instructor = await seedRoleUser({
    firstName: config.tester_instructor_first_name,
    lastName: config.tester_instructor_last_name,
    email: config.tester_instructor_email,
    password: config.tester_instructor_password,
    role: Role.INSTRUCTOR,
  });
  const student = await seedRoleUser({
    firstName: config.tester_student_first_name,
    lastName: config.tester_student_last_name,
    email: config.tester_student_email,
    password: config.tester_student_password,
    role: Role.STUDENT,
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: { status: EnrollmentStatus.ACTIVE },
    create: {
      userId: student.id,
      studentIdNo: "STU-2026-002",
      status: EnrollmentStatus.ACTIVE,
      batch: "2026",
      semester: 1,
    },
  });

  console.log(
    `Seeded academic users: ${financeAdmin.email}, ${registrar.email}, ${instructor.email}, ${student.email}`,
  );
};
