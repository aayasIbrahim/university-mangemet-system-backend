export interface ICreateSectionPayload {
  sectionName: string;
  capacity?: number;
  courseId: string;
  semesterId: string;
  isActive?: boolean;
}

export interface IUpdateSectionPayload
  extends Partial<ICreateSectionPayload> {}
