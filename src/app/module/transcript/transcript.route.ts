import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { TranscriptController } from "./transcript.controller";
import { TranscriptValidation } from "./transcript.validation";

const router = Router();
const staffRoles = [Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN];
router.post(
  "/:studentId/generate",
  auth(...staffRoles),
  validateRequest(TranscriptValidation.GenerateTranscriptSchema),
  TranscriptController.generateTranscript,
);
router.get(
  "/",
  auth(...staffRoles, Role.INSTRUCTOR),
  TranscriptController.getAllTranscript,
);

router.get(
  "/:transcriptId",
  auth(...staffRoles, Role.INSTRUCTOR, Role.STUDENT),
  TranscriptController.getSingleTranscript,
);
router.patch(
  "/:transcriptId/publish",
  auth(...staffRoles),
  TranscriptController.publishTranscript,
);
router.get("/my", auth(Role.STUDENT), TranscriptController.getMyTranscripts);

export const TranscriptRoutes = router;
