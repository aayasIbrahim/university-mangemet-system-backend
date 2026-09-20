import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import httpStatus from "http-status";

import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { UserRoutes } from "./app/module/user/user.route";
import { DepartmentRoutes } from "./app/module/department/department.route";
import { ProgramRoutes } from "./app/module/program/program.route";
import { CourseRoutes } from "./app/module/course/course.route";
import { SemesterRoutes } from "./app/module/semester/semester.route";
import { SectionRoutes } from "./app/module/section/section.route";
import { CourseEnrollmentRoutes } from "./app/module/courseEnrollment/courseEnrollment.route";
import { AttendanceRoutes } from "./app/module/attendance/attendance.route";
import { ExamRoutes } from "./app/module/exam/exam.route";
import { TranscriptRoutes } from "./app/module/transcript/transcript.route";
import { AcademicReportRoutes } from "./app/module/academicReport/academicReport.route";
import { PaymentRoutes, PaymentWebhookRoutes } from "./app/module/payment/payment.route";

const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }), PaymentWebhookRoutes);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/departments", DepartmentRoutes);
app.use("/api/v1/program", ProgramRoutes);
app.use("/api/v1/course", CourseRoutes);
app.use("/api/v1/semester", SemesterRoutes);
app.use("/api/v1/section", SectionRoutes);
app.use("/api/v1/course-enrollments", CourseEnrollmentRoutes);
app.use("/api/v1/attendance", AttendanceRoutes);
app.use("/api/v1/exam", ExamRoutes);
app.use("/api/v1/transcripts", TranscriptRoutes);
app.use("/api/v1/academic-reports", AcademicReportRoutes);
app.use("/api/v1/payments", PaymentRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to university Mangement System",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
