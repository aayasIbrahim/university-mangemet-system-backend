import { AttendanceStatus } from "../../../generated/prisma/enums";


export interface IStudentAttendancePayload {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface IBulkUpsertAttendancePayload {
  attendances: IStudentAttendancePayload[];
}