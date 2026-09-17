import { ProgramType } from "../../../generated/prisma/enums";

export interface ICreateProgramPayload {
  name: string;
  code: string;
  degree?: string | null;
  durationYears?: number | null;
  description?: string | null;
  totalCredits: number;
  type: ProgramType;
  departmentId: string;
  isActive?: boolean;
}

export type IUpdateProgramPayload = Omit<
  Partial<ICreateProgramPayload>,
  "departmentId"
>;
