export const calculateGradeAndPoint = (
  totalMark: number,
): { finalGradePoint: number; finalLetterGrade: string } => {
  if (totalMark >= 80) return { finalGradePoint: 4.0, finalLetterGrade: "A+" };
  if (totalMark >= 75) return { finalGradePoint: 3.75, finalLetterGrade: "A" };
  if (totalMark >= 70) return { finalGradePoint: 3.5, finalLetterGrade: "A-" };
  if (totalMark >= 65) return { finalGradePoint: 3.25, finalLetterGrade: "B+" };
  if (totalMark >= 60) return { finalGradePoint: 3.0, finalLetterGrade: "B" };
  if (totalMark >= 55) return { finalGradePoint: 2.75, finalLetterGrade: "B-" };
  if (totalMark >= 50) return { finalGradePoint: 2.5, finalLetterGrade: "C+" };
  if (totalMark >= 45) return { finalGradePoint: 2.25, finalLetterGrade: "C" };
  if (totalMark >= 40) return { finalGradePoint: 2.0, finalLetterGrade: "D" };
  return { finalGradePoint: 0.0, finalLetterGrade: "F" };
};
