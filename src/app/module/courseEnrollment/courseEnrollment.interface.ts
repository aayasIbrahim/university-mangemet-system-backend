export interface IEnrollCoursePayload {
  studentId: string;
  sectionId: string;
}
export interface IUpdateEnrollmentMarksPayload {
  classTestsMark?: number;
  midTermMark?: number;
  finalExamMark?: number;
  attendanceMark?: number;
}