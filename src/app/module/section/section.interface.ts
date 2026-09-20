export interface ICreateSectionPayload {
  sectionName: string;
  capacity?: number;
  roomNumber?: string;
  courseId: string;
  semesterId: string;
  isActive?: boolean;
}

export interface IUpdateSectionPayload extends Partial<ICreateSectionPayload> {}
