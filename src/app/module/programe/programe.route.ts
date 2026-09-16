import { Router } from "express";
import { ProgramController } from "./program.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ProgramValidation } from "./program.validation";

const router = Router();


router.post(
  "/create-program",
  auth("SUPER_ADMIN", "REGISTRAR"), // শুধুমাত্র সুপার অ্যাডমিন ও রেজিস্ট্রার ডিগ্রি প্ল্যান তৈরি করতে পারবে
  validateRequest(ProgramValidation.CreateProgramZodSchema),
  ProgramController.createProgram
);

// ২. সকল প্রোগ্রামের লিস্ট দেখা (Pagination, Search & Filtering সহ)
// এটি সবার জন্য পাবলিক রাখা হয়েছে ড্রপডাউন এবং কারিকুলাম ব্রাউজ করার সুবিধার জন্য
router.get(
  "/",
  ProgramController.getAllPrograms
);

// ৩. নির্দিষ্ট একটি প্রোগ্রামের ডিটেইলস দেখা (ID দিয়ে)
router.get(
  "/:id",
  ProgramController.getProgramById
);

// ৪. প্রোগ্রামের তথ্য আপডেট করা (Update)
router.patch(
  "/:id",
  auth("SUPER_ADMIN", "REGISTRAR", "DEPARTMENT_ADMIN"), // ডিপার্টমেন্ট হেডও তার নিজস্ব প্রোগ্রাম মডিফাই করতে পারবে
  validateRequest(ProgramValidation.UpdateProgramZodSchema),
  ProgramController.updateProgram
);

// ۵. প্রোগ্রাম সফট ডিলিট করা (Soft Delete)
router.delete(
  "/:id",
  auth("SUPER_ADMIN"), // ডিগ্রি বা প্রোগ্রাম বাতিল করার মতো সেন্সিটিভ ডিসিশন শুধু সুপার অ্যাডমিন নিতে পারবে
  ProgramController.deleteProgram
);

export const ProgramRoutes = router;
