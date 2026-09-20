# University Management System Backend

This project solves the problem of managing a university digitally in one platform. It handles student registration, academic operations, finance, admin management, and reporting from a single backend.

## What this backend does

- Student signup/login and role-based access
- Department, program, course, semester, and section management
- Student application approval/rejection workflow
- Course enrollment and grade updates
- Attendance marking
- Exam creation and marks submission
- Transcript and academic report generation
- Invoice, payment, refund, and Stripe webhook support
- Admin dashboard and audit log management

## Tech stack

- Node.js + Express.js + TypeScript
- Prisma ORM + PostgreSQL
- Redis
- JWT + Zod validation
- Stripe + Cloudinary + Nodemailer

## Project setup

```bash
npm install
npm run dev
```

Create a `.env` file with required values for database, JWT, email, Stripe, Cloudinary, and Redis.

## Base URL

```text
http://localhost:5000/api/v1
```

## API routes

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/google`

### User

- `PATCH /api/v1/user/profile`
- `PATCH /api/v1/user/profile-image`

### Student application

- `POST /api/v1/student-applications/apply`
- `POST /api/v1/student-applications/verify-email`
- `GET /api/v1/student-applications/`
- `POST /api/v1/student-applications/approve`
- `POST /api/v1/student-applications/reject`

### Department

- `POST /api/v1/departments/create-department`
- `GET /api/v1/departments/all-department`
- `GET /api/v1/departments/:departmentId`
- `PATCH /api/v1/departments/:departmentId`
- `DELETE /api/v1/departments/:departmentId`
- `GET /api/v1/departments/:departmentId/programs`

### Program

- `POST /api/v1/program/create-program`
- `GET /api/v1/program/all-program`
- `GET /api/v1/program/:programId`
- `PATCH /api/v1/program/:programId`
- `DELETE /api/v1/program/:programId`

### Course

- `POST /api/v1/course/create-course`
- `GET /api/v1/course/all-course`
- `GET /api/v1/course/:courseId`
- `PATCH /api/v1/course/:courseId`
- `DELETE /api/v1/course/:courseId`
- `GET /api/v1/course/:courseId/prerequisites`

### Semester

- `POST /api/v1/semester/create-semester`
- `GET /api/v1/semester/all-semesters`
- `GET /api/v1/semester/:semesterId`
- `PATCH /api/v1/semester/:semesterId`
- `DELETE /api/v1/semester/:semesterId`

### Section

- `POST /api/v1/section/create-section`
- `GET /api/v1/section/all-sections`
- `GET /api/v1/section/:sectionId`
- `PATCH /api/v1/section/:sectionId`
- `DELETE /api/v1/section/:sectionId`

### Course enrollment

- `POST /api/v1/course-enrollments/enroll`
- `PATCH /api/v1/course-enrollments/:enrollmentId/update-marks`
- `PATCH /api/v1/course-enrollments/:enrollmentId/drop`
- `GET /api/v1/course-enrollments/my-enrollments`
- `GET /api/v1/course-enrollments/my-courses`

### Attendance

- `POST /api/v1/attendance/session/:classSessionId/mark`

### Exam

- `POST /api/v1/exam/create-exam`
- `GET /api/v1/exam/all-exam`
- `GET /api/v1/exam/:examId`
- `PATCH /api/v1/exam/:examId`
- `DELETE /api/v1/exam/:examId`
- `POST /api/v1/exam/:examId/marks`
- `GET /api/v1/exam/:examId/marks`

### Transcript

- `POST /api/v1/transcripts/:studentId/generate`
- `GET /api/v1/transcripts/`
- `GET /api/v1/transcripts/:transcriptId`
- `PATCH /api/v1/transcripts/:transcriptId/publish`
- `GET /api/v1/transcripts/my`

### Academic report

- `POST /api/v1/academic-reports/generate`
- `GET /api/v1/academic-reports/`
- `GET /api/v1/academic-reports/:reportId`

### Payment

- `POST /api/v1/payments/invoices`
- `GET /api/v1/payments/invoices`
- `GET /api/v1/payments/invoices/me`
- `GET /api/v1/payments/invoices/:invoiceId/status`
- `POST /api/v1/payments/invoices/:invoiceId/checkout`
- `POST /api/v1/payments/invoices/:invoiceId/manual-pay`
- `POST /api/v1/payments/invoices/:invoiceId/cancel`
- `POST /api/v1/payments/payments/:paymentId/refund`
- `POST /api/v1/payments/webhook`

### Admin

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/role`
- `GET /api/v1/admin/dashboard-stats`
- `GET /api/v1/admin/audit-logs`

## Roles used

- `SUPER_ADMIN`
- `REGISTRAR`
- `DEPARTMENT_ADMIN`
- `FINANCE_ADMIN`
- `INSTRUCTOR`
- `STUDENT`

## Summary

This backend is built for a digital university workflow. It removes manual coordination by connecting student data, admissions, registration, attendance, exams, finance, and reporting in one system.

## License

ISC
