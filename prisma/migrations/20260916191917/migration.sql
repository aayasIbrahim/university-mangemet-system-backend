-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('CORE', 'ELECTIVE', 'NON_CREDIT');

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "type" "CourseType" NOT NULL DEFAULT 'CORE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" UUID NOT NULL,
    "programId" UUID NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisites" (
    "courseId" UUID NOT NULL,
    "prerequisiteId" UUID NOT NULL,

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("courseId","prerequisiteId")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");

-- CreateIndex
CREATE INDEX "courses_programId_idx" ON "courses"("programId");

-- CreateIndex
CREATE INDEX "courses_isActive_idx" ON "courses"("isActive");

-- CreateIndex
CREATE INDEX "courses_isDeleted_idx" ON "courses"("isDeleted");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
