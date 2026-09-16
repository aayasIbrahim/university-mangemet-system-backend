import { ProgramType } from "../../../generated/prisma/enums";

export interface ICreateProgramPayload {
  name: string;
  degree?: string | null;
  durationYears?: number | null;
  description?: string | null;
  totalCredits: number; 
  type: ProgramType;    
  departmentId: string;
}

export type IUpdateProgramPayload = Omit<Partial<ICreateProgramPayload>, 'departmentId'>;