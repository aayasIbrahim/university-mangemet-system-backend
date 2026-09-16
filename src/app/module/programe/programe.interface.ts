import { ProgramType } from "../../../generated/prisma/enums";

export interface ICreateProgramPayload {
  name: string;
  degree?: string | null;
  durationYears?: number | null;
  description?: string | null;
  totalCredits: number; // Optional if you want to fall back to the schema's 120 default
  type?: ProgramType;    // Optional if you want to fall back to UNDERGRADUATE default
  isActive?: boolean;
  departmentId: string;
}

export type IUpdateProgramPayload = Partial<ICreateProgramPayload>