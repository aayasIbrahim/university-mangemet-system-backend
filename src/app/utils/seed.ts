import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import {
  AttendanceStatus,
  ClassSessionStatus,
  CourseType,
  EnrollmentStatus,
  InstructorStatus,
  ProgramType,
  Role,
  StudentStatus,
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
    Number(config.bcrypt_salt_rounds),
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
      password: hashedPassword,
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
    select: { id: true, email: true, role: true },
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
    update: {
      status: StudentStatus.ACTIVE,
      batch: "2026",
      semester: 1,
      isDeleted: false,
    },
    create: {
      userId: student.id,
      studentIdNo: "STU-2026-002",
      status: StudentStatus.ACTIVE,
      batch: "2026",
      semester: 1,
    },
  });

  console.log(
    `Seeded academic users: ${financeAdmin.email}, ${registrar.email}, ${instructor.email}, ${student.email}`,
  );
};

export const seedIndustryData = async () => {
  const departmentCount = await prisma.department.count();
  if (departmentCount > 0) {
    console.log("Industry seed data already exists. Skipping seed operation.");
    return;
  }

  const departments = [
    {
      name: "Computer Science and Engineering",
      code: "CSE",
      description:
        "Core computing, software engineering, AI, and systems design.",
    },
    {
      name: "Electrical and Electronic Engineering",
      code: "EEE",
      description:
        "Power systems, electronics, embedded systems, and signal processing.",
    },
    {
      name: "Business Administration",
      code: "BBA",
      description:
        "Finance, operations, marketing, and business leadership programs.",
    },
  ];

  const createdDepartments: Record<string, { id: string }> = {};

  for (const department of departments) {
    const adminUser = await seedRoleUser({
      firstName: `${department.code.slice(0, 1)} Department`,
      lastName: "Admin",
      email: `${department.code.toLowerCase()}.admin@university.edu`,
      password: `${department.code.toLowerCase()}Admin@123`,
      role: Role.DEPARTMENT_ADMIN,
    });

    const savedDepartment = await prisma.department.upsert({
      where: { code: department.code },
      update: {
        name: department.name,
        description: department.description,
        isActive: true,
        adminId: adminUser.id,
      },
      create: {
        name: department.name,
        code: department.code,
        description: department.description,
        isActive: true,
        adminId: adminUser.id,
      },
      select: { id: true, code: true },
    });

    createdDepartments[department.code] = { id: savedDepartment.id };
  }

  const semesters = [
    {
      name: "Fall 2026",
      code: "FALL26",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
      isCurrent: true,
    },
    {
      name: "Spring 2027",
      code: "SPRING27",
      startDate: new Date("2027-01-15T00:00:00.000Z"),
      endDate: new Date("2027-05-30T00:00:00.000Z"),
      isCurrent: false,
    },
  ];

  const createdSemesters: Record<string, { id: string }> = {};

  for (const semester of semesters) {
    const savedSemester = await prisma.semester.upsert({
      where: { code: semester.code },
      update: {
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        isCurrent: semester.isCurrent,
        isActive: true,
      },
      create: {
        name: semester.name,
        code: semester.code,
        startDate: semester.startDate,
        endDate: semester.endDate,
        isCurrent: semester.isCurrent,
      },
      select: { id: true, code: true },
    });

    createdSemesters[semester.code] = { id: savedSemester.id };
  }

  const programs = [
    {
      name: "Bachelor of Science in Computer Science",
      code: "BSCS",
      degree: "BSc",
      durationYears: 4,
      description:
        "Software engineering, algorithms, data systems, and intelligent applications.",
      totalCredits: 136,
      type: ProgramType.UNDERGRADUATE,
      departmentCode: "CSE",
    },
    {
      name: "Bachelor of Science in Electrical Engineering",
      code: "BSEE",
      degree: "BSc",
      durationYears: 4,
      description:
        "Power electronics, circuits, and advanced electrical systems design.",
      totalCredits: 132,
      type: ProgramType.UNDERGRADUATE,
      departmentCode: "EEE",
    },
    {
      name: "Bachelor of Business Administration",
      code: "BBA",
      degree: "BBA",
      durationYears: 4,
      description:
        "Management, entrepreneurship, marketing, and finance foundation.",
      totalCredits: 128,
      type: ProgramType.UNDERGRADUATE,
      departmentCode: "BBA",
    },
  ];

  const createdPrograms: Record<string, { id: string; departmentId: string }> =
    {};

  for (const program of programs) {
    const departmentId = createdDepartments[program.departmentCode].id;

    const savedProgram = await prisma.program.upsert({
      where: { code: program.code },
      update: {
        name: program.name,
        degree: program.degree,
        durationYears: program.durationYears,
        description: program.description,
        totalCredits: program.totalCredits,
        type: program.type,
        isActive: true,
        departmentId,
      },
      create: {
        name: program.name,
        code: program.code,
        degree: program.degree,
        durationYears: program.durationYears,
        description: program.description,
        totalCredits: program.totalCredits,
        type: program.type,
        departmentId,
      },
      select: { id: true, code: true, departmentId: true },
    });

    createdPrograms[program.code] = {
      id: savedProgram.id,
      departmentId: savedProgram.departmentId,
    };
  }

  const courses = [
    {
      code: "CSE-101",
      title: "Introduction to Programming",
      credits: 3,
      type: CourseType.CORE,
      departmentCode: "CSE",
      programCode: "BSCS",
      semesterCode: "FALL26",
    },
    {
      code: "CSE-201",
      title: "Data Structures and Algorithms",
      credits: 3.5,
      type: CourseType.CORE,
      departmentCode: "CSE",
      programCode: "BSCS",
      semesterCode: "FALL26",
    },
    {
      code: "CSE-301",
      title: "Database Management Systems",
      credits: 3,
      type: CourseType.CORE,
      departmentCode: "CSE",
      programCode: "BSCS",
      semesterCode: "SPRING27",
    },
    {
      code: "EEE-101",
      title: "Electrical Circuits I",
      credits: 3.5,
      type: CourseType.CORE,
      departmentCode: "EEE",
      programCode: "BSEE",
      semesterCode: "FALL26",
    },
    {
      code: "EEE-205",
      title: "Digital Electronics",
      credits: 3,
      type: CourseType.CORE,
      departmentCode: "EEE",
      programCode: "BSEE",
      semesterCode: "SPRING27",
    },
    {
      code: "BBA-101",
      title: "Principles of Management",
      credits: 3,
      type: CourseType.CORE,
      departmentCode: "BBA",
      programCode: "BBA",
      semesterCode: "FALL26",
    },
  ];

  const createdCourses: Record<
    string,
    { id: string; departmentId: string; semesterId: string }
  > = {};

  for (const course of courses) {
    const departmentId = createdDepartments[course.departmentCode].id;
    const semesterId = createdSemesters[course.semesterCode].id;
    const programId = createdPrograms[course.programCode].id;

    const savedCourse = await prisma.course.upsert({
      where: { code: course.code },
      update: {
        title: course.title,
        credits: course.credits,
        type: course.type,
        departmentId,
        semesterId,
        programId,
        isActive: true,
      },
      create: {
        code: course.code,
        title: course.title,
        credits: course.credits,
        type: course.type,
        departmentId,
        semesterId,
        programId,
      },
      select: { id: true, code: true, departmentId: true, semesterId: true },
    });

    createdCourses[course.code] = {
      id: savedCourse.id,
      departmentId: savedCourse.departmentId,
      semesterId: savedCourse.semesterId,
    };
  }

  const instructorSeedData = [
    {
      email: "nasrin.haque@university.edu",
      firstName: "Nasrin",
      lastName: "Haque",
      employeeIdNo: "EMP-2026-001",
      designation: "Assistant Professor",
      departmentCode: "CSE",
      specialization:
        "Algorithms, Artificial Intelligence, and Software Engineering",
      roomNumber: "Room 403-A",
    },
    {
      email: "mohammed.rahman@university.edu",
      firstName: "Mohammed",
      lastName: "Rahman",
      employeeIdNo: "EMP-2026-002",
      designation: "Lecturer",
      departmentCode: "EEE",
      specialization: "Power Systems and Embedded Hardware",
      roomNumber: "Room 220-B",
    },
    {
      email: "sadia.akhtar@university.edu",
      firstName: "Sadia",
      lastName: "Akhtar",
      employeeIdNo: "EMP-2026-003",
      designation: "Senior Lecturer",
      departmentCode: "BBA",
      specialization: "Operations Management and Strategic Leadership",
      roomNumber: "Room 116-C",
    },
  ];

  const createdInstructorProfiles: Record<
    string,
    { id: string; userId: string }
  > = {};

  for (const instructor of instructorSeedData) {
    const user = await seedRoleUser({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      email: instructor.email,
      password: "University@123",
      role: Role.INSTRUCTOR,
    });

    const instructorProfile = await prisma.instructorProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeIdNo: instructor.employeeIdNo,
        designation: instructor.designation,
        departmentId: createdDepartments[instructor.departmentCode].id,
        specialization: instructor.specialization,
        roomNumber: instructor.roomNumber,
        status: InstructorStatus.ACTIVE,
      },
      create: {
        userId: user.id,
        employeeIdNo: instructor.employeeIdNo,
        designation: instructor.designation,
        departmentId: createdDepartments[instructor.departmentCode].id,
        specialization: instructor.specialization,
        roomNumber: instructor.roomNumber,
        joiningDate: new Date("2024-01-15T00:00:00.000Z"),
      },
      select: { id: true, userId: true },
    });

    createdInstructorProfiles[instructor.email] = {
      id: instructorProfile.id,
      userId: instructorProfile.userId,
    };
  }

  const studentSeedData = [
    {
      email: "amir.hossain@student.university.edu",
      firstName: "Amir",
      lastName: "Hossain",
      studentIdNo: "STU-2026-101",
      batch: "2026",
    },
    {
      email: "nabila.islam@student.university.edu",
      firstName: "Nabila",
      lastName: "Islam",
      studentIdNo: "STU-2026-102",
      batch: "2026",
    },
    {
      email: "tanvir.ahmed@student.university.edu",
      firstName: "Tanvir",
      lastName: "Ahmed",
      studentIdNo: "STU-2026-103",
      batch: "2026",
    },
    {
      email: "tahmina.khan@student.university.edu",
      firstName: "Tahmina",
      lastName: "Khan",
      studentIdNo: "STU-2026-104",
      batch: "2026",
    },
    {
      email: "rabbi.miah@student.university.edu",
      firstName: "Rabbi",
      lastName: "Miah",
      studentIdNo: "STU-2026-105",
      batch: "2026",
    },
    {
      email: "sakib.hasan@student.university.edu",
      firstName: "Sakib",
      lastName: "Hasan",
      studentIdNo: "STU-2026-106",
      batch: "2026",
    },
  ];

  const createdStudentProfiles: Record<string, { id: string; userId: string }> =
    {};

  for (const student of studentSeedData) {
    const user = await seedRoleUser({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      password: "Student@123",
      role: Role.STUDENT,
    });

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentIdNo: student.studentIdNo,
        batch: student.batch,
        semester: 1,
        status: StudentStatus.ACTIVE,
        isDeleted: false,
      },
      create: {
        userId: user.id,
        studentIdNo: student.studentIdNo,
        batch: student.batch,
        semester: 1,
        status: StudentStatus.ACTIVE,
      },
      select: { id: true, userId: true },
    });

    createdStudentProfiles[student.email] = {
      id: studentProfile.id,
      userId: studentProfile.userId,
    };
  }

  const sections = [
    {
      courseCode: "CSE-101",
      sectionName: "A",
      semesterCode: "FALL26",
      instructorEmail: "nasrin.haque@university.edu",
    },
    {
      courseCode: "CSE-201",
      sectionName: "B",
      semesterCode: "FALL26",
      instructorEmail: "nasrin.haque@university.edu",
    },
    {
      courseCode: "EEE-101",
      sectionName: "A",
      semesterCode: "FALL26",
      instructorEmail: "mohammed.rahman@university.edu",
    },
    {
      courseCode: "BBA-101",
      sectionName: "A",
      semesterCode: "FALL26",
      instructorEmail: "sadia.akhtar@university.edu",
    },
  ];

  const createdSections: Record<
    string,
    { id: string; courseId: string; semesterId: string }
  > = {};

  for (const section of sections) {
    const course = createdCourses[section.courseCode];
    const instructorId = createdInstructorProfiles[section.instructorEmail].id;

    const savedSection = await prisma.section.upsert({
      where: {
        courseId_semesterId_sectionName: {
          courseId: course.id,
          semesterId: course.semesterId,
          sectionName: section.sectionName,
        },
      },
      update: {
        capacity: 40,
        isActive: true,
        instructorId,
      },
      create: {
        courseId: course.id,
        semesterId: course.semesterId,
        sectionName: section.sectionName,
        capacity: 40,
        instructorId,
      },
      select: { id: true, courseId: true, semesterId: true },
    });

    createdSections[`${section.courseCode}-${section.sectionName}`] = {
      id: savedSection.id,
      courseId: savedSection.courseId,
      semesterId: savedSection.semesterId,
    };
  }

  const sectionStudentMap: Record<string, string[]> = {
    "CSE-101-A": [
      "amir.hossain@student.university.edu",
      "nabila.islam@student.university.edu",
      "tanvir.ahmed@student.university.edu",
    ],
    "CSE-201-B": [
      "tahmina.khan@student.university.edu",
      "rabbi.miah@student.university.edu",
      "sakib.hasan@student.university.edu",
    ],
    "EEE-101-A": [
      "amir.hossain@student.university.edu",
      "tahmina.khan@student.university.edu",
      "sakib.hasan@student.university.edu",
    ],
    "BBA-101-A": [
      "nabila.islam@student.university.edu",
      "rabbi.miah@student.university.edu",
      "tanvir.ahmed@student.university.edu",
    ],
  };

  for (const [sectionKey, studentEmails] of Object.entries(sectionStudentMap)) {
    const section = createdSections[sectionKey];
    const instructorUserId =
      createdInstructorProfiles[
        sections.find(
          (item) =>
            item.courseCode === sectionKey.split("-")[0] &&
            item.sectionName === sectionKey.split("-")[1],
        )?.instructorEmail ?? "nasrin.haque@university.edu"
      ]?.userId;

    for (const email of studentEmails) {
      const studentProfile = createdStudentProfiles[email];

      await prisma.courseEnrollment.upsert({
        where: {
          studentId_sectionId: {
            studentId: studentProfile.id,
            sectionId: section.id,
          },
        },
        update: {
          status: EnrollmentStatus.ENROLLED,
          semesterId: section.semesterId,
          courseId: section.courseId,
          classTestsMark: 85,
          midTermMark: 88,
          finalExamMark: 90,
          attendanceMark: 90,
          totalMark: 353,
        },
        create: {
          studentId: studentProfile.id,
          sectionId: section.id,
          semesterId: section.semesterId,
          courseId: section.courseId,
          status: EnrollmentStatus.ENROLLED,
        },
      });
    }

    if (instructorUserId) {
      const classSessionDates = [
        new Date("2026-09-10T00:00:00.000Z"),
        new Date("2026-09-17T00:00:00.000Z"),
      ];

      for (const date of classSessionDates) {
        const session = await prisma.classSession.findFirst({
          where: {
            sectionId: section.id,
            date,
            startTime: "09:00",
          },
          select: { id: true },
        });

        const sessionId =
          session?.id ??
          (
            await prisma.classSession.create({
              data: {
                sectionId: section.id,
                date,
                startTime: "09:00",
                endTime: "10:30",
                topic: `${sections.find((item) => item.courseCode === sectionKey.split("-")[0] && item.sectionName === sectionKey.split("-")[1])?.courseCode ?? "Course"} Weekly Session`,
                status: ClassSessionStatus.COMPLETED,
              },
              select: { id: true },
            })
          ).id;

        for (const email of studentEmails) {
          const studentProfile = createdStudentProfiles[email];
          const status =
            email === studentEmails[0]
              ? AttendanceStatus.PRESENT
              : email === studentEmails[1]
                ? AttendanceStatus.LATE
                : AttendanceStatus.ABSENT;

          await prisma.attendance.upsert({
            where: {
              classSessionId_studentId: {
                classSessionId: sessionId,
                studentId: studentProfile.id,
              },
            },
            update: {
              status,
              remarks:
                status === AttendanceStatus.ABSENT
                  ? "Approved leave not submitted"
                  : "Regular attendance",
              submittedById: instructorUserId,
            },
            create: {
              classSessionId: sessionId,
              studentId: studentProfile.id,
              status,
              remarks:
                status === AttendanceStatus.ABSENT
                  ? "Approved leave not submitted"
                  : "Regular attendance",
              submittedById: instructorUserId,
            },
          });
        }
      }
    }
  }

  console.log("Industry-standard academic seed data created successfully.");
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    await prisma.$connect();
    console.log("Connected to database for seed execution.");

    await seedSuperAdmin();
    await seedTesterAdmin();
    await seedTesterAcademicUsers();
    await seedIndustryData();
  } catch (error) {
    console.error("Error running seed script:", error);
  } finally {
    await prisma.$disconnect();
  }
}
