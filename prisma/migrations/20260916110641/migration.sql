/*
  Warnings:

  - You are about to drop the column `code` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `program` on the `student_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[programId]` on the table `student_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('UNDERGRADUATE', 'GRADUATE', 'POSTGRADUATE', 'DIPLOMA');

-- DropIndex
DROP INDEX "programs_code_key";

-- AlterTable
ALTER TABLE "programs" DROP COLUMN "code",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalCredits" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "type" "ProgramType" NOT NULL DEFAULT 'UNDERGRADUATE';

-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "program",
ADD COLUMN     "programId" UUID;

-- CreateIndex
CREATE INDEX "programs_isDeleted_idx" ON "programs"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_programId_key" ON "student_profiles"("programId");

-- CreateIndex
CREATE INDEX "student_profiles_programId_idx" ON "student_profiles"("programId");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
