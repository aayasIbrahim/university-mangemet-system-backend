import { AttendanceStatus } from "../../../generated/prisma/enums";

export interface IAttendanceRecordPayload {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface IMarkAttendancePayload {
  attendances: IAttendanceRecordPayload[];
}

export interface IUpdateAttendancePayload {
  status?: AttendanceStatus;
  remarks?: string | null;
}
