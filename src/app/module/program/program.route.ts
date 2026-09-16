import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { ProgramValidation } from "./program.validation";
import { ProgramController } from "./program.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/create-program",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR),
  validateRequest(ProgramValidation.CreateProgramZodSchema),
  ProgramController.createProgram,
);

router.get("/all-program", ProgramController.getAllPrograms);

router.get("/:programId", ProgramController.getSingleProgram);

router.patch(
  "/:programId",
  auth(Role.SUPER_ADMIN, Role.REGISTRAR, Role.DEPARTMENT_ADMIN),
  validateRequest(ProgramValidation.UpdateProgramZodSchema),
  ProgramController.updateProgram,
);

router.delete(
  "/:programId",
  auth(Role.SUPER_ADMIN),
  ProgramController.deleteProgram,
);

export const ProgramRoutes = router;
