import { CourseType } from "../../../generated/prisma/enums";

export interface ICoursePayload {
  code: string;
  title: string;
  credits: number;
  type: CourseType,
  departmentId: string;
  programId: string;
  prerequisites?: string[]; 
}

export interface IUpdateCoursePayload extends Partial<Omit<ICoursePayload, 'departmentId' | 'programId'>> {
  isActive?: boolean;
}
