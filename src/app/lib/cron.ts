import cron from "node-cron";
import { prisma } from "./prisma";

export const deleteUnverifiedStudentApplications = async () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const deletedApplications = await prisma.studentApplication.deleteMany({
        where: {
          emailVerified: false,
          status: "PENDING",
          createdAt: {
            lt: oneHourAgo,
          },
        },
      });

      if (deletedApplications.count > 0) {
        console.log(
          `Cron: Deleted ${deletedApplications.count} unverified student applications older than 1 hour.`,
        );
      }
    } catch (error) {
      console.log(
        "Cron: Failed to delete unverified student applications.",
        error,
      );
    }

    console.log("Unverified student application cleanup cron is running.");
  });
};
