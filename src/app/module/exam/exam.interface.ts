import { ExamStatus, ExamType } from "../../../generated/prisma/enums";

export interface ICreateExamPayload {
  title: string;
  type: ExamType;
  status: ExamStatus;
  totalMarks: number;
  weightage: number;
  examDate: string | Date;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  sectionId: string;
  instructorId: string;
}

export type IUpdateExamPayload = Partial<ICreateExamPayload>;

export interface IExamMarkPayload {
  studentId: string;
  obtainedMarks: number;
  isAbsent?: boolean;
  remarks?: string;
}

export interface ISubmitExamMarksPayload {
  marks: IExamMarkPayload[];
}
