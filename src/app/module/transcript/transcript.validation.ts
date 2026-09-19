import { z } from "zod";
import { TranscriptStatus } from "../../../generated/prisma/enums";

const StudentIdSchema = z.string().uuid("Student ID must be a valid UUID");

const GenerateTranscriptSchema = z.object({
  semesterId: z.string().uuid("Semester ID must be a valid UUID"),
});

const TranscriptQuerySchema = z.object({
  studentId: StudentIdSchema.optional(),
  semesterId: z.string().uuid("Semester ID must be a valid UUID").optional(),
  status: z.nativeEnum(TranscriptStatus).optional(),
});

export const TranscriptValidation = {
  StudentIdSchema,
  GenerateTranscriptSchema,
  TranscriptQuerySchema,
};
