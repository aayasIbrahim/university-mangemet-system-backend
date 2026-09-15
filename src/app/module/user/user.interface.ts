import type { z } from "zod";
import { UpdateProfileZodSchema } from "./user.validation";

export type IUpdateProfilePayload = z.infer<typeof UpdateProfileZodSchema>;
