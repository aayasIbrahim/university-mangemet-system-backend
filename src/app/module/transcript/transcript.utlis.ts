
export const transcriptInclude = {
  semester: { select: { id: true, name: true, code: true } },
  student: {
    select: {
      id: true,
      studentIdNo: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  entries: { orderBy: { courseCode: "asc" as const } },
};