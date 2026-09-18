export const calculateGradeAndPoint = (totalMark: number): { finalGradePoint: number; finalLetterGrade: string } => {
  if (totalMark >= 80) return { finalGradePoint: 4.00, finalLetterGrade: "A+" };
  if (totalMark >= 75) return { finalGradePoint: 3.75, finalLetterGrade: "A" };
  if (totalMark >= 70) return { finalGradePoint: 3.50, finalLetterGrade: "A-" };
  if (totalMark >= 65) return { finalGradePoint: 3.25, finalLetterGrade: "B+" };
  if (totalMark >= 60) return { finalGradePoint: 3.00, finalLetterGrade: "B" };
  if (totalMark >= 55) return { finalGradePoint: 2.75, finalLetterGrade: "B-" };
  if (totalMark >= 50) return { finalGradePoint: 2.50, finalLetterGrade: "C+" };
  if (totalMark >= 45) return { finalGradePoint: 2.25, finalLetterGrade: "C" };
  if (totalMark >= 40) return { finalGradePoint: 2.00, finalLetterGrade: "D" };
  return { finalGradePoint: 0.00, finalLetterGrade: "F" };
};
