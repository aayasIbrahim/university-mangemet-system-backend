# University Management System Backend

A modern university backend built with TypeScript, Express, Prisma, and PostgreSQL for managing students, academic departments, enrollments, exams, transcripts, payments, and administrative workflows.

This project is designed to support a university platform where students can register, authenticate, view academic information, enroll in courses, and pay fees, while admins, instructors, and registrar staff manage academic and operational processes.

## Status

This repository is in active development. Core authentication, user management, academic management, exam workflows, and payment infrastructure are implemented, and the project continues to expand with additional admin and academic automation features.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Database & Prisma](#database--prisma)
- [License](#license)

## Overview

The University Management System Backend provides the API layer for a digital campus platform. It handles authentication, role-based access control, academic administration, learning workflows, payment operations, and reporting.

The application follows a modular backend architecture, with each domain organized into dedicated route, controller, validation, and service layers.

## Features

- Student registration and login
- Role-based access control using JWT
- Department, program, course, semester, and section management
- Student application approval and rejection flow
- Course enrollment and mark updates
- Attendance tracking
- Exam management and marks submission
- Transcript and academic report generation
- Invoice and payment processing
- Stripe webhook integration
- Admin dashboard and audit log support
- Cloudinary upload support
- Redis integration
- Email sending support

## Technology Stack

- TypeScript
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- bcryptjs
- Nodemailer
- Cloudinary
- CORS
- Zod validation
- tsx for local development

## Project Structure

```text
.
├── biome.json
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── README.md
├── prisma/
│   └── schema/
│       ├── acadamicReport.prisma
│       ├── attendances.prisma
│       ├── auditLog.prisma
│       ├── classSession.prisma
│       ├── course.prisma
│       ├── courseEnrollment.prisma
│       ├── department.prisma
│       ├── enums.prisma
│       ├── exam.prisma
│       ├── examMark.prisma
│       ├── instructorProfile.prisma
│       ├── invoice.prisma
│       ├── invoiceItem.prisma
│       ├── payment.prisma
│       ├── program.prisma
│       ├── schema.prisma
│       ├── section.prisma
│       ├── semester.prisma
│       ├── studentApplication.prisma
│       ├── studentProfile.prisma
│       ├── transcript.prisma
│       ├── transcriptEnrty.prisma
│       └── user.prisma
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── app/
│   │   ├── config/
│   │   ├── interfaces/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── module/
│   │   │   ├── academicReport/
│   │   │   ├── admin/
│   │   │   ├── attendance/
│   │   │   ├── auth/
│   │   │   ├── course/
│   │   │   ├── courseEnrollment/
│   │   │   ├── department/
│   │   │   ├── exam/
│   │   │   ├── payment/
│   │   │   ├── program/
│   │   │   ├── section/
│   │   │   ├── semester/
│   │   │   ├── studentApplication/
│   │   │   ├── transcript/
│   │   │   └── user/
│   │   ├── templates/
│   │   ├── utils/
│   │   └── interfaces/
│   └── generated/
│       └── prisma/
└── node_modules/
```

### Core backend directories

- `src/app/module/` — domain-specific backend features
- `src/app/middleware/` — auth, validation, and error handling
- `src/app/lib/` — Prisma, Redis, email, uploads, payments, and other integrations
- `src/app/config/` — environment configuration loader
- `src/app/utils/` — helper functions and seed scripts
- `prisma/schema/` — Prisma models split by academic domain

## Prerequisites

Make sure the following are installed:

- Node.js 18+
- PostgreSQL
- Redis
- npm

Verify:

```bash
node -v
npm -v
psql -V
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/university-management-system-backend.git
cd university-management-system-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory and add values such as:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/university_db?schema=public"
FRONTEND_URL=http://localhost:3000

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

SUPER_ADMIN_FRIST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=superadmin@gmail.com
SUPER_ADMIN_PASSWORD=Super@admin12345

TESTER_ADMIN_FIRST_NAME=Tester
TESTER_ADMIN_LAST_NAME=Admin
TESTER_ADMIN_EMAIL=testeradmin@gmail.com
TESTER_ADMIN_PASSWORD=Tester@admin12345

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your_redis_password

SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
EMAIL_SENDER=your_email

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel
```

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Start the application

```bash
npm run dev
```

The server should start and log successful database and Redis connection messages.

### 7. Health check

```bash
curl http://localhost:5000/
```

Expected response:

```json
{
  "success": true,
  "message": "Welcome to university Mangement System"
}
```

## Environment Variables

The application configuration is centralized in `src/app/config/index.ts` and reads values from `.env`.

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment |
| `PORT` | Port used by Express |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `SMTP_USER` | Email provider username |
| `SMTP_PASSWORD` | Email provider password |
| `EMAIL_SENDER` | Sender email |
| `CLOUDINARY_*` | Cloudinary credentials |
| `STRIPE_*` | Stripe payment config |

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run format:check
npm run format:fix
npm run lint:check
npm run lint:fix
<<<<<<< HEAD
=======
npm run  "stripe:webhook":,
>>>>>>> 63ee8fb (feat: add reset password success and student welcome email templates)
```

### Script notes

- `npm run dev` — starts the app in development mode
- `npm run build` — compiles TypeScript
- `npm run start` — starts the compiled app
- `npm run lint:*` and `npm run format:*` — beautify and validate the codebase

## API Overview

Base URL:

```text
http://localhost:5000/api/v1
```

### Core endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Health check endpoint |

### Authentication endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | No | Register a student |
| `POST` | `/api/v1/auth/verify-email` | No | Verify email |
| `POST` | `/api/v1/auth/login` | No | Login user |
| `GET` | `/api/v1/auth/me` | Yes | Fetch current user |
| `POST` | `/api/v1/auth/refresh-token` | No | Refresh access token |
| `POST` | `/api/v1/auth/forgot-password` | No | Request password reset |
| `POST` | `/api/v1/auth/reset-password` | No | Reset password |
| `POST` | `/api/v1/auth/google` | No | Google login |

### User endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `PATCH` | `/api/v1/user/profile` | Yes | Update user profile |
| `PATCH` | `/api/v1/user/profile-image` | Yes | Upload profile image |

### Student application endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/student-applications/apply` | No | Submit student application |
| `POST` | `/api/v1/student-applications/verify-email` | No | Verify application email |
| `GET` | `/api/v1/student-applications/` | Yes | View all applications |
| `POST` | `/api/v1/student-applications/approve` | Yes | Approve application |
| `POST` | `/api/v1/student-applications/reject` | Yes | Reject application |

### Department endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/departments/create-department` | Yes | Create department |
| `GET` | `/api/v1/departments/all-department` | No | Get all departments |
| `GET` | `/api/v1/departments/:departmentId` | No | Get signle department |
| `PATCH` | `/api/v1/departments/:departmentId` | Yes | Update department |
| `DELETE` | `/api/v1/departments/:departmentId` | Yes | Delete department |
| `GET` | `/api/v1/departments/:departmentId/programs` | No | Get department programs |

### Program endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/program/create-program` | Yes | Create program |
| `GET` | `/api/v1/program/all-program` | No | Get all programs |
| `GET` | `/api/v1/program/:programId` | No | Get single program |
| `PATCH` | `/api/v1/program/:programId` | Yes | Update program |
| `DELETE` | `/api/v1/program/:programId` | Yes | Delete program |

### Course endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/course/create-course` | Yes | Create course |
| `GET` | `/api/v1/course/all-course` | No | Get all courses |
| `GET` | `/api/v1/course/:courseId` | No | Get single course |
| `PATCH` | `/api/v1/course/:courseId` | Yes | Update course |
| `DELETE` | `/api/v1/course/:courseId` | Yes | Delete course |
| `GET` | `/api/v1/course/:courseId/prerequisites` | Yes | Get prerequisites |

### Semester endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/semester/create-semester` | Yes | Create semester |
| `GET` | `/api/v1/semester/all-semesters` | Yes | Get all semesters |
| `GET` | `/api/v1/semester/:semesterId` | Yes | Get single semester |
| `PATCH` | `/api/v1/semester/:semesterId` | Yes | Update semester |
| `DELETE` | `/api/v1/semester/:semesterId` | Yes | Delete semester |

### Section endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/section/create-section` | Yes | Create section |
| `GET` | `/api/v1/section/all-sections` | Yes | Get all sections |
| `GET` | `/api/v1/section/:sectionId` | Yes | Get single section |
| `PATCH` | `/api/v1/section/:sectionId` | Yes | Update section |
| `DELETE` | `/api/v1/section/:sectionId` | Yes | Delete section |

### Course enrollment endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/course-enrollments/enroll` | Yes | Enroll student |
| `PATCH` | `/api/v1/course-enrollments/:enrollmentId/update-marks` | Yes | Update marks |
| `PATCH` | `/api/v1/course-enrollments/:enrollmentId/drop` | Yes | Drop course |
| `GET` | `/api/v1/course-enrollments/my-enrollments` | Yes | Get enrollments |
| `GET` | `/api/v1/course-enrollments/my-courses` | Yes | Get student courses |

### Attendance endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/attendance/session/:classSessionId/mark` | Yes | Mark attendance |

### Exam endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/exam/create-exam` | Yes | Create exam |
| `GET` | `/api/v1/exam/all-exam` | Yes | Get all exams |
| `GET` | `/api/v1/exam/:examId` | Yes | Get single exam |
| `PATCH` | `/api/v1/exam/:examId` | Yes | Update exam |
| `DELETE` | `/api/v1/exam/:examId` | Yes | Delete exam |
| `POST` | `/api/v1/exam/:examId/marks` | Yes | Submit marks |
| `GET` | `/api/v1/exam/:examId/marks` | Yes | View marks |

### Transcript endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/transcripts/:studentId/generate` | Yes | Generate transcript |
| `GET` | `/api/v1/transcripts/` | Yes | Get all transcripts |
| `GET` | `/api/v1/transcripts/:transcriptId` | Yes | Get single transcript |
| `PATCH` | `/api/v1/transcripts/:transcriptId/publish` | Yes | Publish transcript |
| `GET` | `/api/v1/transcripts/my` | Yes | Get my transcript |

### Academic report endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/academic-reports/generate` | Yes | Generate report |
| `GET` | `/api/v1/academic-reports/` | Yes | Get all reports |
| `GET` | `/api/v1/academic-reports/:reportId` | Yes | Get single report |

### Payment endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/payments/invoices` | Yes | Create invoice |
| `GET` | `/api/v1/payments/invoices` | Yes | Get all invoices |
| `GET` | `/api/v1/payments/invoices/me` | Yes | Get my invoices |
| `GET` | `/api/v1/payments/invoices/:invoiceId/status` | Yes | Check invoice status |
| `POST` | `/api/v1/payments/invoices/:invoiceId/checkout` | Yes | Create checkout |
| `POST` | `/api/v1/payments/invoices/:invoiceId/manual-pay` | Yes | Manual payment |
| `POST` | `/api/v1/payments/invoices/:invoiceId/cancel` | Yes | Cancel invoice |
| `POST` | `/api/v1/payments/payments/:paymentId/refund` | Yes | Refund payment |
| `POST` | `/api/v1/payments/webhook` | No | Stripe webhook |

### Admin endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/admin/users` | Yes | List users |
| `PATCH` | `/api/v1/admin/users/:id/role` | Yes | Update user role |
| `GET` | `/api/v1/admin/dashboard-stats` | Yes | Get dashboard stats |
| `GET` | `/api/v1/admin/audit-logs` | Yes | Get audit logs |

## Database & Prisma

This project uses Prisma as the ORM layer and PostgreSQL as the primary database.

To work with the schema:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## License

This project is licensed under the ISC License.
