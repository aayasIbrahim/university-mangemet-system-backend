export interface ICreateSemesterPayload {
  name: string;
  code: string;
  startDate: string | Date;
  endDate: string | Date;
  isCurrent?: boolean;
  isActive?: boolean;
}

export interface ISemesterUpdatePayload extends Partial<ICreateSemesterPayload> {}
