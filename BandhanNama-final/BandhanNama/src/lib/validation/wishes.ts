import { z } from "zod";

export const lookupWishSchema = z.object({
  name: z.string().trim().min(1).max(80)
}).strict();

export const verifyWishSchema = z.object({
  name: z.string().trim().min(1).max(80),
  pin: z.string().trim().min(4).max(12).regex(/^[0-9]+$/, "PIN must contain digits only.")
}).strict();
